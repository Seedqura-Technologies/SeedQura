import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { createNotification } from "../lib/notifications.js";
import {
  enrollmentConfirmationEmail,
  paymentFailedEmail,
  paymentSuccessEmail,
  sendMail,
} from "../lib/mail.js";

export const paymentsRouter = Router();

function razorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

async function activateEnrollment(opts: {
  enrollmentId: string;
  userId: string;
  courseId: string;
  paymentRowId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
}) {
  const admin = getSupabaseAdmin();
  await admin
    .from("payments")
    .update({
      status: "paid",
      razorpay_payment_id: opts.razorpayPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.paymentRowId);

  await admin
    .from("enrollments")
    .update({
      status: "active",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.enrollmentId);

  const [{ data: profile }, { data: course }] = await Promise.all([
    admin.from("profiles").select("full_name, email").eq("id", opts.userId).maybeSingle(),
    admin.from("courses").select("name, price_display").eq("id", opts.courseId).maybeSingle(),
  ]);

  const name = profile?.full_name || "";
  const email = profile?.email;
  const courseName = course?.name || opts.courseId;
  const amountDisplay =
    course?.price_display ||
    `₹${(opts.amount / 100).toLocaleString("en-IN")}`;

  await createNotification({
    userId: opts.userId,
    type: "payment_success",
    title: "Payment confirmed",
    body: `You're enrolled in ${courseName}.`,
    metadata: { courseId: opts.courseId },
  });

  if (email) {
    const pay = paymentSuccessEmail(name, courseName, amountDisplay);
    await sendMail({ to: email, ...pay });
    const enroll = enrollmentConfirmationEmail(name, courseName);
    await sendMail({ to: email, ...enroll });
  }
}

paymentsRouter.post("/order", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const courseId = String(req.body?.courseId || "");
    if (!courseId) {
      res.status(400).json({ error: "courseId required" });
      return;
    }

    const admin = getSupabaseAdmin();
    const { data: course, error } = await admin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    if (course.price_inr == null || course.price_inr <= 0) {
      res.status(400).json({ error: "Course is not available for purchase" });
      return;
    }
    if (
      course.registration_deadline &&
      new Date(course.registration_deadline) < new Date()
    ) {
      res.status(400).json({ error: "Registration deadline has passed" });
      return;
    }

    const { data: existing } = await admin
      .from("enrollments")
      .select("id, status, payment_status")
      .eq("user_id", req.userId!)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing?.status === "active" && existing.payment_status === "paid") {
      res.status(400).json({ error: "Already enrolled" });
      return;
    }

    let enrollmentId = existing?.id;
    if (!enrollmentId) {
      const { data: created, error: eErr } = await admin
        .from("enrollments")
        .insert({
          user_id: req.userId!,
          course_id: courseId,
          status: "pending_payment",
          payment_status: "pending",
        })
        .select("id")
        .single();
      if (eErr) throw eErr;
      enrollmentId = created.id;
    } else {
      await admin
        .from("enrollments")
        .update({
          status: "pending_payment",
          payment_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrollmentId);
    }

    const amountPaise = course.price_inr * 100;
    const rz = razorpayClient();

    if (!rz) {
      // Dev fallback when Razorpay keys missing: create local "order"
      const fakeOrderId = `order_dev_${Date.now()}`;
      const { data: payment, error: pErr } = await admin
        .from("payments")
        .insert({
          enrollment_id: enrollmentId,
          razorpay_order_id: fakeOrderId,
          amount: amountPaise,
          currency: course.currency || "INR",
          status: "created",
          raw: { mode: "dev" },
        })
        .select("id")
        .single();
      if (pErr) throw pErr;

      res.json({
        orderId: fakeOrderId,
        amount: amountPaise,
        currency: course.currency || "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dev",
        enrollmentId,
        paymentId: payment.id,
        courseName: course.name,
        studentName: req.profile?.full_name || "",
        studentEmail: req.userEmail || "",
        devMode: true,
      });
      return;
    }

    const order = await rz.orders.create({
      amount: amountPaise,
      currency: course.currency || "INR",
      receipt: `enr_${enrollmentId}`.slice(0, 40),
      notes: {
        enrollment_id: enrollmentId!,
        course_id: courseId,
        user_id: req.userId!,
      },
    });

    const { data: payment, error: pErr } = await admin
      .from("payments")
      .insert({
        enrollment_id: enrollmentId,
        razorpay_order_id: order.id,
        amount: amountPaise,
        currency: course.currency || "INR",
        status: "created",
        raw: order,
      })
      .select("id")
      .single();
    if (pErr) throw pErr;

    res.json({
      orderId: order.id,
      amount: amountPaise,
      currency: course.currency || "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      enrollmentId,
      paymentId: payment.id,
      courseName: course.name,
      studentName: req.profile?.full_name || "",
      studentEmail: req.userEmail || "",
      devMode: false,
    });
  } catch (err) {
    console.error("[payments/order]", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

paymentsRouter.post("/verify", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
      enrollmentId,
      courseId,
      devComplete,
    } = req.body || {};

    const admin = getSupabaseAdmin();

    // Dev mode: allow completing without Razorpay when keys unset
    if (devComplete && String(razorpay_order_id || "").startsWith("order_dev_")) {
      const { data: payment } = await admin
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .eq("razorpay_order_id", razorpay_order_id)
        .maybeSingle();
      if (!payment) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }
      await activateEnrollment({
        enrollmentId: enrollmentId || payment.enrollment_id,
        userId: req.userId!,
        courseId,
        paymentRowId: payment.id,
        razorpayPaymentId: `pay_dev_${Date.now()}`,
        amount: payment.amount,
        currency: payment.currency,
      });
      res.json({ ok: true, devMode: true });
      return;
    }

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !paymentId
    ) {
      res.status(400).json({ error: "Missing payment fields" });
      return;
    }

    if (
      !verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    ) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const { data: payment } = await admin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("razorpay_order_id", razorpay_order_id)
      .maybeSingle();

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    const { data: enrollment } = await admin
      .from("enrollments")
      .select("*")
      .eq("id", payment.enrollment_id)
      .maybeSingle();

    if (!enrollment || enrollment.user_id !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await activateEnrollment({
      enrollmentId: enrollment.id,
      userId: req.userId!,
      courseId: enrollment.course_id,
      paymentRowId: payment.id,
      razorpayPaymentId: razorpay_payment_id,
      amount: payment.amount,
      currency: payment.currency,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[payments/verify]", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

paymentsRouter.post("/failed", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { courseId, paymentId } = req.body || {};
    const admin = getSupabaseAdmin();
    if (paymentId) {
      await admin
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", paymentId);
    }
    if (courseId) {
      const { data: course } = await admin
        .from("courses")
        .select("name")
        .eq("id", courseId)
        .maybeSingle();
      const email = req.userEmail;
      if (email) {
        const mail = paymentFailedEmail(
          req.profile?.full_name || "",
          course?.name || courseId
        );
        await sendMail({ to: email, ...mail });
      }
      await createNotification({
        userId: req.userId!,
        type: "payment_failed",
        title: "Payment failed",
        body: `Payment for ${course?.name || courseId} did not complete.`,
        metadata: { courseId },
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[payments/failed]", err);
    res.status(500).json({ error: "Failed to record failure" });
  }
});

paymentsRouter.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    if (secret && signature) {
      const body = JSON.stringify(req.body);
      const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      if (expected !== signature) {
        res.status(400).json({ error: "Invalid webhook signature" });
        return;
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload?.payment?.entity;
    if (event === "payment.captured" && payload?.order_id) {
      const admin = getSupabaseAdmin();
      const { data: payment } = await admin
        .from("payments")
        .select("*")
        .eq("razorpay_order_id", payload.order_id)
        .maybeSingle();
      if (payment && payment.status !== "paid") {
        const { data: enrollment } = await admin
          .from("enrollments")
          .select("*")
          .eq("id", payment.enrollment_id)
          .maybeSingle();
        if (enrollment) {
          await activateEnrollment({
            enrollmentId: enrollment.id,
            userId: enrollment.user_id,
            courseId: enrollment.course_id,
            paymentRowId: payment.id,
            razorpayPaymentId: payload.id,
            amount: payment.amount,
            currency: payment.currency,
          });
        }
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[payments/webhook]", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});
