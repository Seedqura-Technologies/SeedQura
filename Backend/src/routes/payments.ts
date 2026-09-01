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
import { syncEnrollmentCalendar } from "../lib/enrollment-calendar-sync.js";
import { fellowshipPaymentBlocked } from "../lib/fellowship-gate.js";

export const paymentsRouter = Router();

let _razorpay: Razorpay | null | undefined;

function razorpayClient(): Razorpay | null {
  if (_razorpay !== undefined) return _razorpay;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    _razorpay = null;
    return null;
  }
  _razorpay = new Razorpay({ key_id, key_secret });
  return _razorpay;
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
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(signature), "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Fire-and-forget side effects — never block the HTTP response. */
function runBackground(label: string, work: Promise<unknown>) {
  void work.catch((err) => {
    console.error(`[payments/${label}]`, err);
  });
}

async function notifyPaymentSuccess(opts: {
  userId: string;
  courseId: string;
  amount: number;
  name: string;
  email: string | null | undefined;
  courseName: string;
  amountDisplay: string;
}) {
  const tasks: Promise<unknown>[] = [
    createNotification({
      userId: opts.userId,
      type: "payment_success",
      title: "Payment confirmed",
      body: `You're enrolled in ${opts.courseName}.`,
      metadata: { courseId: opts.courseId },
    }),
  ];

  if (opts.email) {
    const pay = paymentSuccessEmail(
      opts.name,
      opts.courseName,
      opts.amountDisplay
    );
    const enroll = enrollmentConfirmationEmail(opts.name, opts.courseName);
    tasks.push(
      sendMail({ to: opts.email, ...pay }),
      sendMail({ to: opts.email, ...enroll })
    );
  }

  await Promise.all(tasks);
}

/**
 * Persist paid state (blocking). Notifications/emails run in parallel afterward
 * and can be deferred by the caller so verify responds immediately.
 */
async function activateEnrollment(opts: {
  enrollmentId: string;
  userId: string;
  courseId: string;
  paymentRowId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  /** When true, wait for emails/notifications (webhook). Default: background. */
  awaitSideEffects?: boolean;
}) {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Independent row updates — run together to cut round-trips.
  const [payRes, enrRes, profileRes, courseRes] = await Promise.all([
    admin
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id: opts.razorpayPaymentId,
        updated_at: now,
      })
      .eq("id", opts.paymentRowId)
      .neq("status", "paid"),
    admin
      .from("enrollments")
      .update({
        status: "active",
        payment_status: "paid",
        updated_at: now,
      })
      .eq("id", opts.enrollmentId),
    admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", opts.userId)
      .maybeSingle(),
    admin
      .from("courses")
      .select("name, price_display")
      .eq("id", opts.courseId)
      .maybeSingle(),
  ]);

  if (payRes.error) throw payRes.error;
  if (enrRes.error) throw enrRes.error;

  const name = profileRes.data?.full_name || "";
  const email = profileRes.data?.email;
  const courseName = courseRes.data?.name || opts.courseId;
  const amountDisplay =
    courseRes.data?.price_display ||
    `₹${(opts.amount / 100).toLocaleString("en-IN")}`;

  const sideEffects = notifyPaymentSuccess({
    userId: opts.userId,
    courseId: opts.courseId,
    amount: opts.amount,
    name,
    email,
    courseName,
    amountDisplay,
  }).then(async () => {
    const calendar = await syncEnrollmentCalendar(opts.enrollmentId);
    if (!calendar.ok && calendar.syncStatus !== "not_applicable") {
      console.warn("[activateEnrollment] enrollment calendar sync incomplete", {
        userId: opts.userId,
        courseId: opts.courseId,
        direction: calendar.direction,
        syncStatus: calendar.syncStatus,
        errors: calendar.errors,
        enrollmentId: opts.enrollmentId,
      });
    }
  });

  if (opts.awaitSideEffects) {
    await sideEffects;
  } else {
    runBackground("activate-notify", sideEffects);
  }
}

const COURSE_ORDER_FIELDS =
  "id, name, status, price_inr, price_display, currency, registration_deadline";

/** Pre-check fellowship payment gate before the student fills the UTR form. */
paymentsRouter.get(
  "/fellowship-eligibility",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      const courseId = String(req.query.courseId || "");
      if (!courseId) {
        res.status(400).json({ error: "courseId required" });
        return;
      }
      const gate = await fellowshipPaymentBlocked(courseId, req.userEmail);
      if (gate.blocked) {
        res.json({
          eligible: false,
          message: gate.message,
          email: req.userEmail ?? null,
        });
        return;
      }
      res.json({
        eligible: true,
        email: req.userEmail ?? null,
      });
    } catch (err) {
      console.error("[payments/fellowship-eligibility]", err);
      res.status(500).json({ error: "Failed to check eligibility" });
    }
  }
);

paymentsRouter.post("/order", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const courseId = String(req.body?.courseId || "");
    if (!courseId) {
      res.status(400).json({ error: "courseId required" });
      return;
    }

    const fellowshipGate = await fellowshipPaymentBlocked(courseId, req.userEmail);
    if (fellowshipGate.blocked) {
      res.status(403).json({ error: fellowshipGate.message });
      return;
    }

    const admin = getSupabaseAdmin();
    const userId = req.userId!;

    // Parallel: course lookup + existing enrollment
    const [{ data: course, error }, { data: existing }] = await Promise.all([
      admin
        .from("courses")
        .select(COURSE_ORDER_FIELDS)
        .eq("id", courseId)
        .eq("status", "published")
        .maybeSingle(),
      admin
        .from("enrollments")
        .select("id, status, payment_status")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle(),
    ]);

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

    if (existing?.status === "active" && existing.payment_status === "paid") {
      res.status(400).json({ error: "Already enrolled" });
      return;
    }

    let enrollmentId = existing?.id;
    if (!enrollmentId) {
      const { data: created, error: eErr } = await admin
        .from("enrollments")
        .insert({
          user_id: userId,
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
    const currency = course.currency || "INR";
    const rz = razorpayClient();

    const studentName = req.profile?.full_name || "";
    const studentEmail = req.userEmail || "";

    if (!rz) {
      const fakeOrderId = `order_dev_${Date.now()}`;
      const { data: payment, error: pErr } = await admin
        .from("payments")
        .insert({
          enrollment_id: enrollmentId,
          razorpay_order_id: fakeOrderId,
          amount: amountPaise,
          currency,
          status: "created",
          raw: { mode: "dev" },
        })
        .select("id")
        .single();
      if (pErr) throw pErr;

      res.json({
        orderId: fakeOrderId,
        amount: amountPaise,
        currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dev",
        enrollmentId,
        paymentId: payment.id,
        courseName: course.name,
        studentName,
        studentEmail,
        devMode: true,
      });
      return;
    }

    const order = await rz.orders.create({
      amount: amountPaise,
      currency,
      receipt: `enr_${enrollmentId}`.slice(0, 40),
      notes: {
        enrollment_id: enrollmentId!,
        course_id: courseId,
        user_id: userId,
      },
    });

    const { data: payment, error: pErr } = await admin
      .from("payments")
      .insert({
        enrollment_id: enrollmentId,
        razorpay_order_id: order.id,
        amount: amountPaise,
        currency,
        status: "created",
        raw: order,
      })
      .select("id")
      .single();
    if (pErr) throw pErr;

    res.json({
      orderId: order.id,
      amount: amountPaise,
      currency,
      keyId:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      enrollmentId,
      paymentId: payment.id,
      courseName: course.name,
      studentName,
      studentEmail,
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
        .select(
          "id, amount, currency, status, enrollment_id, enrollment:enrollments(id, user_id, course_id)"
        )
        .eq("id", paymentId)
        .eq("razorpay_order_id", razorpay_order_id)
        .maybeSingle();
      if (!payment) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      if (payment.status === "paid") {
        res.json({ ok: true, devMode: true, alreadyPaid: true });
        return;
      }

      const enrollment = Array.isArray(payment.enrollment)
        ? payment.enrollment[0]
        : payment.enrollment;

      await activateEnrollment({
        enrollmentId: enrollmentId || payment.enrollment_id,
        userId: req.userId!,
        courseId: courseId || enrollment?.course_id,
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

    // Verify signature before any DB work
    if (
      !verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    ) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    // Single query: payment + enrollment
    const { data: payment } = await admin
      .from("payments")
      .select(
        "id, amount, currency, status, enrollment_id, razorpay_order_id, enrollment:enrollments(id, user_id, course_id)"
      )
      .eq("id", paymentId)
      .eq("razorpay_order_id", razorpay_order_id)
      .maybeSingle();

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    const enrollment = Array.isArray(payment.enrollment)
      ? payment.enrollment[0]
      : payment.enrollment;

    if (!enrollment || enrollment.user_id !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Idempotent: already verified
    if (payment.status === "paid") {
      res.json({ ok: true, alreadyPaid: true });
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

    // Client gets success as soon as DB is committed; emails continue in background
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

    const tasks: Promise<unknown>[] = [];
    if (paymentId) {
      tasks.push(
        Promise.resolve(
          admin
            .from("payments")
            .update({ status: "failed", updated_at: new Date().toISOString() })
            .eq("id", paymentId)
        )
      );
    }

    let courseName = courseId ? String(courseId) : "";
    if (courseId) {
      tasks.push(
        Promise.resolve(
          admin.from("courses").select("name").eq("id", courseId).maybeSingle()
        ).then(({ data }) => {
          courseName = data?.name || String(courseId);
        })
      );
    }

    await Promise.all(tasks);

    // Respond first — failure notification must not delay the client
    res.json({ ok: true });

    if (courseId) {
      const email = req.userEmail;
      const name = req.profile?.full_name || "";
      runBackground(
        "failed-notify",
        Promise.all([
          email
            ? sendMail({
                to: email,
                ...paymentFailedEmail(name, courseName),
              })
            : Promise.resolve(),
          createNotification({
            userId: req.userId!,
            type: "payment_failed",
            title: "Payment failed",
            body: `Payment for ${courseName} did not complete.`,
            metadata: { courseId },
          }),
        ])
      );
    }
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
      if (!verifyWebhookSignature(body, signature)) {
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
        .select(
          "id, amount, currency, status, enrollment_id, enrollment:enrollments(id, user_id, course_id)"
        )
        .eq("razorpay_order_id", payload.order_id)
        .maybeSingle();

      if (payment && payment.status !== "paid") {
        const enrollment = Array.isArray(payment.enrollment)
          ? payment.enrollment[0]
          : payment.enrollment;
        if (enrollment) {
          // Commit paid state before ACK; emails still run in background
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

function normalizeUtr(raw: string): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Interim founder-UPI flow: student pays via QR, pastes UTR, waits for admin approve.
 */
paymentsRouter.post("/utr-submit", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const courseId = String(req.body?.courseId || "").trim();
    const utr = normalizeUtr(req.body?.utr || "");
    const applicantName = String(req.body?.fullName || "").trim();
    const institution = String(req.body?.institution || "").trim();
    const degree = String(req.body?.degree || "").trim();
    const yearOfStudy = String(req.body?.yearOfStudy || "").trim();
    const applicantPhone = String(req.body?.phone || "").trim();

    if (!courseId) {
      res.status(400).json({ error: "courseId required" });
      return;
    }
    if (utr.length < 8 || utr.length > 64 || !/^[A-Z0-9]+$/.test(utr)) {
      res.status(400).json({
        error: "Enter a valid UTR / UPI transaction ID (letters and numbers only).",
      });
      return;
    }
    if (applicantName.length < 2) {
      res.status(400).json({ error: "Full name is required" });
      return;
    }
    if (institution.length < 2) {
      res.status(400).json({ error: "College / institution is required" });
      return;
    }
    if (!degree) {
      res.status(400).json({ error: "Degree is required" });
      return;
    }
    if (!yearOfStudy) {
      res.status(400).json({ error: "Year of study is required" });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(applicantPhone.replace(/\s/g, ""))) {
      res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number" });
      return;
    }

    const fellowshipGate = await fellowshipPaymentBlocked(courseId, req.userEmail);
    if (fellowshipGate.blocked) {
      res.status(403).json({ error: fellowshipGate.message });
      return;
    }

    const admin = getSupabaseAdmin();
    const userId = req.userId!;
    const phone = applicantPhone.replace(/\s/g, "");

    const [{ data: course, error: cErr }, { data: existing }, { data: utrTaken }] =
      await Promise.all([
        admin
          .from("courses")
          .select(COURSE_ORDER_FIELDS)
          .eq("id", courseId)
          .eq("status", "published")
          .maybeSingle(),
        admin
          .from("enrollments")
          .select("id, status, payment_status")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .maybeSingle(),
        admin
          .from("enrollments")
          .select("id, user_id")
          .eq("utr", utr)
          .maybeSingle(),
      ]);

    if (cErr) throw cErr;
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

    if (existing?.status === "active" && existing.payment_status === "paid") {
      res.status(400).json({ error: "Already enrolled in this course" });
      return;
    }

    if (utrTaken && utrTaken.user_id !== userId) {
      res.status(400).json({ error: "This UTR is already linked to another enrollment" });
      return;
    }

    const now = new Date().toISOString();
    const enrollmentPayload = {
      status: "pending_payment",
      payment_status: "awaiting_verification",
      utr,
      institution,
      degree,
      year_of_study: yearOfStudy,
      applicant_phone: phone,
      applicant_name: applicantName,
      utr_submitted_at: now,
      updated_at: now,
    };

    let enrollmentId = existing?.id;
    if (!enrollmentId) {
      const { data: created, error: eErr } = await admin
        .from("enrollments")
        .insert({
          user_id: userId,
          course_id: courseId,
          ...enrollmentPayload,
        })
        .select("id")
        .single();
      if (eErr) throw eErr;
      enrollmentId = created.id;
    } else {
      const { error: uErr } = await admin
        .from("enrollments")
        .update(enrollmentPayload)
        .eq("id", enrollmentId);
      if (uErr) throw uErr;
    }

    // Keep profile in sync for admin readability
    await admin
      .from("profiles")
      .update({
        full_name: applicantName,
        phone,
        updated_at: now,
      })
      .eq("id", userId);

    const amountPaise = course.price_inr * 100;
    const { data: existingPay } = await admin
      .from("payments")
      .select("id")
      .eq("enrollment_id", enrollmentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const paymentRaw = {
      method: "upi_utr",
      utr,
      applicantName,
      institution,
      degree,
      yearOfStudy,
      phone,
    };

    if (existingPay?.id) {
      await admin
        .from("payments")
        .update({
          amount: amountPaise,
          currency: course.currency || "INR",
          status: "created",
          raw: paymentRaw,
          updated_at: now,
        })
        .eq("id", existingPay.id);
    } else {
      const { error: pErr } = await admin.from("payments").insert({
        enrollment_id: enrollmentId,
        amount: amountPaise,
        currency: course.currency || "INR",
        status: "created",
        raw: paymentRaw,
      });
      if (pErr) throw pErr;
    }

    runBackground(
      "utr-notify",
      createNotification({
        userId,
        type: "utr_submitted",
        title: "Payment submitted",
        body: `UTR received for ${course.name}. We’ll verify and unlock access shortly.`,
        metadata: { courseId, enrollmentId, utr },
      })
    );

    res.json({
      ok: true,
      enrollmentId,
      status: "pending_payment",
      payment_status: "awaiting_verification",
      message:
        "Submitted — we’ll verify your UTR and unlock access (usually within a few hours).",
    });
  } catch (err) {
    console.error("[payments/utr-submit]", err);
    res.status(500).json({ error: "Failed to submit UTR enrollment" });
  }
});
