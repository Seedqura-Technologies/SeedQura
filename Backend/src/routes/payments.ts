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
import {
  fellowshipPaymentBlocked,
  RESEARCH_FELLOWSHIP_ID,
  RESEARCH_FELLOWSHIP_PAYMENT_AMOUNTS,
  RESEARCH_FELLOWSHIP_MONTHLY_INR,
} from "../lib/fellowship-gate.js";
import {
  addDaysIso,
  canPayNextInstallment,
  fellowshipAmountDisplay,
  nextInstallmentNumber,
  planMeta,
  RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT,
  RESEARCH_FELLOWSHIP_INSTALLMENT_INTERVAL_DAYS,
  type FellowshipPaymentPlan,
} from "../lib/fellowship-installments.js";

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
  statusLabel?: string;
  noteHtml?: string;
  sendEnrollmentEmail?: boolean;
  notificationBody?: string;
}) {
  const tasks: Promise<unknown>[] = [
    createNotification({
      userId: opts.userId,
      type: "payment_success",
      title: "Payment confirmed",
      body:
        opts.notificationBody || `You're enrolled in ${opts.courseName}.`,
      metadata: { courseId: opts.courseId },
    }),
  ];

  if (opts.email) {
    const pay = paymentSuccessEmail(
      opts.name,
      opts.courseName,
      opts.amountDisplay,
      {
        statusLabel: opts.statusLabel,
        noteHtml: opts.noteHtml,
        ctaLabel:
          opts.courseId === RESEARCH_FELLOWSHIP_ID
            ? "Open fellowship payment"
            : undefined,
        ctaHref:
          opts.courseId === RESEARCH_FELLOWSHIP_ID
            ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.seedqura.com"}/enroll/${RESEARCH_FELLOWSHIP_ID}#pay`
            : undefined,
      }
    );
    tasks.push(sendMail({ to: opts.email, ...pay }));
    if (opts.sendEnrollmentEmail !== false) {
      const enroll = enrollmentConfirmationEmail(opts.name, opts.courseName);
      tasks.push(sendMail({ to: opts.email, ...enroll }));
    }
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
}): Promise<"activated" | "already_paid"> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Claim the payment row first so verify and the webhook cannot both
  // send emails or fight over the same checkout.
  const { data: claimed, error: claimErr } = await admin
    .from("payments")
    .update({
      status: "paid",
      razorpay_payment_id: opts.razorpayPaymentId,
      updated_at: now,
    })
    .eq("id", opts.paymentRowId)
    .neq("status", "paid")
    .select("id, amount, raw");

  if (claimErr) throw claimErr;
  const won = (claimed?.length ?? 0) > 0;
  if (!won) return "already_paid";

  const paymentClaim = claimed![0];
  const raw =
    paymentClaim?.raw && typeof paymentClaim.raw === "object"
      ? (paymentClaim.raw as Record<string, unknown>)
      : {};
  const paidAmountPaise = Number(paymentClaim?.amount ?? opts.amount);
  const paidAmountInr =
    typeof raw.amountInr === "number"
      ? raw.amountInr
      : Math.round(paidAmountPaise / 100);
  const planFromRaw =
    raw.paymentPlan === "monthly" || raw.paymentPlan === "full"
      ? (raw.paymentPlan as FellowshipPaymentPlan)
      : null;
  const installmentFromRaw =
    typeof raw.installmentNumber === "number" ? raw.installmentNumber : null;

  const [{ data: enrollment }, profileRes, courseRes] = await Promise.all([
    admin
      .from("enrollments")
      .select(
        "id, status, payment_status, payment_plan, installments_total, installments_paid, installment_amount_inr, next_installment_due_at"
      )
      .eq("id", opts.enrollmentId)
      .maybeSingle(),
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

  if (!enrollment) {
    throw new Error("Enrollment missing during payment activation");
  }

  const isFellowship = opts.courseId === RESEARCH_FELLOWSHIP_ID;
  const plan: FellowshipPaymentPlan =
    planFromRaw ||
    (enrollment.payment_plan === "monthly" ? "monthly" : "full");
  const meta = planMeta(plan);
  const prevPaid = Number(enrollment.installments_paid) || 0;
  const total =
    Number(enrollment.installments_total) || meta.installmentsTotal;
  const installmentNumber =
    installmentFromRaw || Math.min(prevPaid + 1, total);
  const installmentsPaid = Math.min(
    Math.max(prevPaid + 1, installmentNumber),
    total
  );
  const fullyPaid = installmentsPaid >= total || plan === "full";
  const paymentStatus = fullyPaid ? "paid" : "partial";
  const nextDue =
    fullyPaid
      ? null
      : addDaysIso(new Date(), RESEARCH_FELLOWSHIP_INSTALLMENT_INTERVAL_DAYS);

  const enrollmentUpdate: Record<string, unknown> = {
    status: "active",
    payment_status: paymentStatus,
    updated_at: now,
  };

  if (isFellowship) {
    enrollmentUpdate.payment_plan = plan;
    enrollmentUpdate.installments_total = total;
    enrollmentUpdate.installments_paid = installmentsPaid;
    enrollmentUpdate.installment_amount_inr =
      Number(enrollment.installment_amount_inr) || meta.installmentAmountInr;
    enrollmentUpdate.next_installment_due_at = nextDue;
    if (fullyPaid) {
      enrollmentUpdate.installment_reminder_sent_at = null;
    }
  }

  const enrRes = await admin
    .from("enrollments")
    .update(enrollmentUpdate)
    .eq("id", opts.enrollmentId)
    .neq("payment_status", "refunded");
  if (enrRes.error) throw enrRes.error;

  const name = profileRes.data?.full_name || "";
  const email = profileRes.data?.email;
  const courseName = courseRes.data?.name || opts.courseId;
  const amountDisplay = isFellowship
    ? fellowshipAmountDisplay({
        amountInr: paidAmountInr,
        plan,
        installmentNumber,
        installmentsTotal: total,
      })
    : courseRes.data?.price_display ||
      `₹${(paidAmountPaise / 100).toLocaleString("en-IN")}`;

  const remaining = Math.max(0, total - installmentsPaid);
  const statusLabel = fullyPaid
    ? "Paid in full"
    : `Installment ${installmentsPaid} of ${total} paid`;
  const noteHtml =
    isFellowship && !fullyPaid
      ? `This is <strong>installment ${installmentsPaid} of ${total}</strong>. Remaining: <strong>${remaining}</strong> × ₹${RESEARCH_FELLOWSHIP_MONTHLY_INR.toLocaleString("en-IN")}. Next due around <strong>${new Date(nextDue!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</strong>. We will email a reminder.`
      : isFellowship && plan === "monthly" && fullyPaid
        ? `All <strong>${total}</strong> monthly installments are complete. Thank you.`
        : undefined;

  const sideEffects = notifyPaymentSuccess({
    userId: opts.userId,
    courseId: opts.courseId,
    amount: paidAmountPaise,
    name,
    email,
    courseName,
    amountDisplay,
    statusLabel,
    noteHtml,
    // Only send the welcome enrollment email on the first successful payment
    sendEnrollmentEmail: installmentsPaid === 1,
    notificationBody: fullyPaid
      ? `You're enrolled in ${courseName}.`
      : `Installment ${installmentsPaid}/${total} received for ${courseName}.`,
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
  return "activated";
}

const OPEN_ORDER_TTL_MS = 20 * 60 * 1000;

function isUniqueViolation(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;
  return (
    error.code === "23505" ||
    /duplicate key|unique constraint/i.test(error.message || "")
  );
}

function gatewayReceipt(enrollmentId: string): string {
  const compact = enrollmentId.replace(/-/g, "").slice(0, 16);
  return `e${compact}${Date.now().toString(36)}`.slice(0, 40);
}

const COURSE_ORDER_FIELDS =
  "id, name, status, price_inr, price_display, currency, registration_deadline";

function resolveCheckoutAmount(
  courseId: string,
  catalogPriceInr: number,
  requestedAmountInr: number | null
):
  | { ok: true; amountInr: number; paymentPlan: "full" | "monthly" | "standard" }
  | { ok: false; error: string } {
  if (courseId === RESEARCH_FELLOWSHIP_ID) {
    if (
      requestedAmountInr == null ||
      !Number.isFinite(requestedAmountInr) ||
      !RESEARCH_FELLOWSHIP_PAYMENT_AMOUNTS.has(requestedAmountInr)
    ) {
      return {
        ok: false,
        error:
          "Choose full (₹19,999) or monthly (₹6,999 × 3 installments) for the fellowship.",
      };
    }
    return {
      ok: true,
      amountInr: requestedAmountInr,
      paymentPlan:
        requestedAmountInr === RESEARCH_FELLOWSHIP_MONTHLY_INR
          ? "monthly"
          : "full",
    };
  }
  if (requestedAmountInr != null && requestedAmountInr !== catalogPriceInr) {
    return { ok: false, error: "Payment amount does not match this course" };
  }
  return { ok: true, amountInr: catalogPriceInr, paymentPlan: "standard" };
}

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
          installment: null,
        });
        return;
      }

      let installment: Record<string, unknown> | null = null;
      if (courseId === RESEARCH_FELLOWSHIP_ID && req.userId) {
        const admin = getSupabaseAdmin();
        const { data: enr } = await admin
          .from("enrollments")
          .select(
            "id, status, payment_status, payment_plan, installments_total, installments_paid, installment_amount_inr, next_installment_due_at"
          )
          .eq("user_id", req.userId)
          .eq("course_id", courseId)
          .maybeSingle();
        if (enr) {
          const total =
            Number(enr.installments_total) ||
            (enr.payment_plan === "monthly"
              ? RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT
              : 1);
          const paid = Number(enr.installments_paid) || 0;
          const canPayNext = canPayNextInstallment(enr);
          installment = {
            enrollmentId: enr.id,
            paymentPlan: enr.payment_plan,
            paymentStatus: enr.payment_status,
            installmentsPaid: paid,
            installmentsTotal: total,
            installmentAmountInr:
              Number(enr.installment_amount_inr) ||
              RESEARCH_FELLOWSHIP_MONTHLY_INR,
            nextInstallmentDueAt: enr.next_installment_due_at,
            nextInstallmentNumber: canPayNext
              ? nextInstallmentNumber(enr)
              : null,
            canPayNext,
            fullyPaid:
              enr.payment_status === "paid" ||
              (total > 0 && paid >= total),
          };
        }
      }

      res.json({
        eligible: true,
        email: req.userEmail ?? null,
        installment,
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
        .select(
          "id, status, payment_status, payment_plan, installments_total, installments_paid, installment_amount_inr, next_installment_due_at, applicant_name, applicant_phone, institution, degree, year_of_study"
        )
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

    const continuingInstallment =
      courseId === RESEARCH_FELLOWSHIP_ID &&
      !!existing &&
      canPayNextInstallment(existing);

    if (
      existing?.status === "active" &&
      existing.payment_status === "paid"
    ) {
      res.status(400).json({ error: "Already enrolled" });
      return;
    }

    if (
      existing?.status === "active" &&
      existing.payment_status === "partial" &&
      !continuingInstallment
    ) {
      res.status(400).json({
        error:
          "Your fellowship installments are already complete or cannot accept another payment right now.",
      });
      return;
    }

    let priced = resolveCheckoutAmount(
      courseId,
      course.price_inr,
      req.body?.amountInr != null && req.body.amountInr !== ""
        ? Number(req.body.amountInr)
        : null
    );
    if (!priced.ok) {
      res.status(400).json({ error: priced.error });
      return;
    }

    let installmentNumber = 1;
    if (continuingInstallment && existing) {
      // Follow-up installments are always the monthly amount — cannot switch to full mid-plan.
      if (priced.paymentPlan !== "monthly") {
        res.status(400).json({
          error:
            "You are on the monthly plan. Pay the next ₹6,999 installment (you cannot switch to full fee mid-plan).",
        });
        return;
      }
      priced = {
        ok: true,
        amountInr: RESEARCH_FELLOWSHIP_MONTHLY_INR,
        paymentPlan: "monthly",
      };
      installmentNumber = nextInstallmentNumber(existing);
    } else if (
      courseId === RESEARCH_FELLOWSHIP_ID &&
      priced.paymentPlan === "monthly"
    ) {
      installmentNumber = 1;
    }

    const applicantName = String(
      req.body?.fullName || existing?.applicant_name || ""
    ).trim();
    const institution = String(
      req.body?.institution || existing?.institution || ""
    ).trim();
    const degree = String(req.body?.degree || existing?.degree || "").trim();
    const yearOfStudy = String(
      req.body?.yearOfStudy || existing?.year_of_study || ""
    ).trim();
    const applicantPhone = String(
      req.body?.phone || existing?.applicant_phone || ""
    ).replace(/\s/g, "");

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
    if (!/^[6-9]\d{9}$/.test(applicantPhone)) {
      res
        .status(400)
        .json({ error: "Enter a valid 10-digit Indian mobile number" });
      return;
    }

    const now = new Date().toISOString();
    let enrollmentId = existing?.id;

    if (continuingInstallment && enrollmentId) {
      // Keep active + partial; only refresh applicant contact fields.
      const { error: touchErr } = await admin
        .from("enrollments")
        .update({
          institution,
          degree,
          year_of_study: yearOfStudy,
          applicant_phone: applicantPhone,
          applicant_name: applicantName,
          updated_at: now,
        })
        .eq("id", enrollmentId)
        .eq("payment_status", "partial");
      if (touchErr) throw touchErr;
    } else {
      const planFields =
        courseId === RESEARCH_FELLOWSHIP_ID
          ? {
              payment_plan: priced.paymentPlan,
              installments_total: planMeta(
                priced.paymentPlan === "monthly" ? "monthly" : "full"
              ).installmentsTotal,
              installments_paid: 0,
              installment_amount_inr: priced.amountInr,
              next_installment_due_at: null,
            }
          : {};

      const enrollmentPayload = {
        status: "pending_payment",
        payment_status: "pending",
        institution,
        degree,
        year_of_study: yearOfStudy,
        applicant_phone: applicantPhone,
        applicant_name: applicantName,
        updated_at: now,
        ...planFields,
      };

      if (!enrollmentId) {
        const created = await admin
          .from("enrollments")
          .insert({
            user_id: userId,
            course_id: courseId,
            ...enrollmentPayload,
          })
          .select("id")
          .single();
        if (created.error) {
          if (!isUniqueViolation(created.error)) throw created.error;
          const again = await admin
            .from("enrollments")
            .select(
              "id, status, payment_status, payment_plan, installments_total, installments_paid"
            )
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .maybeSingle();
          if (again.error) throw again.error;
          if (!again.data) throw created.error;
          if (
            again.data.status === "active" &&
            again.data.payment_status === "paid"
          ) {
            res.status(400).json({ error: "Already enrolled" });
            return;
          }
          if (
            again.data.status === "active" &&
            again.data.payment_status === "partial"
          ) {
            res.status(409).json({
              error:
                "You already have an active installment plan. Refresh and pay the next installment.",
            });
            return;
          }
          enrollmentId = again.data.id;
        } else {
          enrollmentId = created.data.id;
        }
      }

      // Do not downgrade an enrollment that is paid or mid-installment.
      const kept = await admin
        .from("enrollments")
        .update(enrollmentPayload)
        .eq("id", enrollmentId)
        .in("payment_status", ["pending", "awaiting_verification", "failed"])
        .select("id");
      if (kept.error) throw kept.error;
      if (!kept.data?.length) {
        const { data: current } = await admin
          .from("enrollments")
          .select("payment_status")
          .eq("id", enrollmentId)
          .maybeSingle();
        if (current?.payment_status === "partial") {
          res.status(409).json({
            error:
              "You already have an active installment plan. Refresh and pay the next installment.",
          });
          return;
        }
        res.status(400).json({ error: "Already enrolled" });
        return;
      }
    }

    await admin
      .from("profiles")
      .update({
        full_name: applicantName,
        phone: applicantPhone,
        updated_at: now,
      })
      .eq("id", userId);

    const amountPaise = priced.amountInr * 100;
    const currency = course.currency || "INR";
    const rz = razorpayClient();

    const studentName = applicantName || req.profile?.full_name || "";
    const studentEmail = req.userEmail || "";
    const orderNotes = {
      enrollment_id: enrollmentId!,
      course_id: courseId,
      user_id: userId,
      payment_plan: priced.paymentPlan,
      amount_inr: String(priced.amountInr),
      installment_number: String(installmentNumber),
    };

    const checkoutBody = (
      orderId: string,
      paymentRowId: string,
      devMode: boolean
    ) => ({
      orderId,
      amount: amountPaise,
      currency,
      keyId: devMode
        ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dev"
        : process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      enrollmentId,
      paymentId: paymentRowId,
      courseName: course.name,
      studentName,
      studentEmail,
      devMode,
    });

    const { data: openPayment } = await admin
      .from("payments")
      .select("id, razorpay_order_id, amount, status, created_at")
      .eq("enrollment_id", enrollmentId)
      .eq("status", "created")
      .not("razorpay_order_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const openOrderId = openPayment?.razorpay_order_id || "";
    const openIsDev = openOrderId.startsWith("order_dev_");
    const openAge = openPayment?.created_at
      ? Date.now() - new Date(openPayment.created_at).getTime()
      : Number.POSITIVE_INFINITY;
    const canReuse =
      !!openPayment &&
      openPayment.amount === amountPaise &&
      openAge >= 0 &&
      openAge < OPEN_ORDER_TTL_MS &&
      ((openIsDev && !rz) || (!openIsDev && !!rz));

    if (canReuse && openPayment) {
      res.json({
        ...checkoutBody(openOrderId, openPayment.id, openIsDev),
        installmentNumber,
        paymentPlan: priced.paymentPlan,
      });
      return;
    }

    if (openPayment?.id && openPayment.amount !== amountPaise) {
      await admin
        .from("payments")
        .update({ status: "failed", updated_at: now })
        .eq("id", openPayment.id)
        .eq("status", "created");
    }

    const orderId = rz
      ? (
          await rz.orders.create({
            amount: amountPaise,
            currency,
            receipt: gatewayReceipt(enrollmentId!),
            notes: orderNotes,
          })
        ).id
      : `order_dev_${crypto.randomUUID()}`;

    const inserted = await admin
      .from("payments")
      .insert({
        enrollment_id: enrollmentId,
        razorpay_order_id: orderId,
        amount: amountPaise,
        currency,
        status: "created",
        raw: {
          ...(rz ? {} : { mode: "dev" }),
          paymentPlan: orderNotes.payment_plan,
          amountInr: priced.amountInr,
          installmentNumber,
        },
      })
      .select("id")
      .single();

    if (inserted.error) {
      if (!isUniqueViolation(inserted.error)) throw inserted.error;
      const { data: winner } = await admin
        .from("payments")
        .select("id, razorpay_order_id, amount")
        .eq("enrollment_id", enrollmentId)
        .eq("status", "created")
        .eq("amount", amountPaise)
        .not("razorpay_order_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (winner?.razorpay_order_id) {
        res.json(
          checkoutBody(
            winner.razorpay_order_id,
            winner.id,
            winner.razorpay_order_id.startsWith("order_dev_")
          )
        );
        return;
      }
      res.status(409).json({
        error: "A payment is already in progress. Wait a moment and try again.",
      });
      return;
    }

    res.json({
      ...checkoutBody(orderId, inserted.data.id, !rz),
      installmentNumber,
      paymentPlan: priced.paymentPlan,
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

      const result = await activateEnrollment({
        enrollmentId: payment.enrollment_id,
        userId: req.userId!,
        courseId: enrollment?.course_id || courseId,
        paymentRowId: payment.id,
        razorpayPaymentId: `pay_dev_${crypto.randomUUID()}`,
        amount: payment.amount,
        currency: payment.currency,
      });
      res.json({ ok: true, devMode: true, alreadyPaid: result === "already_paid" });
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

    const rz = razorpayClient();
    if (rz) {
      try {
        const remote = (await rz.payments.fetch(razorpay_payment_id)) as {
          order_id?: string;
          amount?: number | string;
        };
        const remoteAmount = Number(remote.amount);
        if (
          remote.order_id !== razorpay_order_id ||
          !Number.isFinite(remoteAmount) ||
          remoteAmount !== Number(payment.amount)
        ) {
          res.status(400).json({ error: "Payment does not match this order" });
          return;
        }
      } catch (err) {
        console.warn("[payments/verify] could not fetch payment", err);
      }
    }

    const result = await activateEnrollment({
      enrollmentId: enrollment.id,
      userId: req.userId!,
      courseId: enrollment.course_id,
      paymentRowId: payment.id,
      razorpayPaymentId: razorpay_payment_id,
      amount: payment.amount,
      currency: payment.currency,
    });

    // Client gets success as soon as DB is committed; emails continue in background
    res.json({ ok: true, alreadyPaid: result === "already_paid" });
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
      const { data: payment } = await admin
        .from("payments")
        .select("id, status, enrollment:enrollments(user_id)")
        .eq("id", paymentId)
        .maybeSingle();
      const owner = Array.isArray(payment?.enrollment)
        ? payment.enrollment[0]
        : payment?.enrollment;
      if (!payment || owner?.user_id !== req.userId) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }
      if (payment.status === "paid") {
        res.json({ ok: true, alreadyPaid: true });
        return;
      }
      await admin
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", paymentId)
        .eq("status", "created");
    }

    const tasks: Promise<unknown>[] = [];

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
      const capturedAmount = Number(payload.amount);
      const { data: rows, error: listErr } = await admin
        .from("payments")
        .select(
          "id, amount, currency, status, enrollment_id, enrollment:enrollments(id, user_id, course_id)"
        )
        .eq("razorpay_order_id", payload.order_id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (listErr) throw listErr;

      const payment =
        (rows || []).find(
          (row) =>
            row.status !== "paid" &&
            (!Number.isFinite(capturedAmount) ||
              Number(row.amount) === capturedAmount)
        ) || null;

      if (payment) {
        const enrollment = Array.isArray(payment.enrollment)
          ? payment.enrollment[0]
          : payment.enrollment;
        if (enrollment) {
          // Commit paid state before ACK; emails still run in background.
          // A simultaneous /verify call claims the same row; only one wins.
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
    const requestedAmountInr =
      req.body?.amountInr != null ? Number(req.body.amountInr) : null;

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

    const priced = resolveCheckoutAmount(
      courseId,
      course.price_inr,
      requestedAmountInr
    );
    if (!priced.ok) {
      res.status(400).json({ error: priced.error });
      return;
    }
    const amountInr = priced.amountInr;
    const paymentPlan = priced.paymentPlan;

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

    const amountPaise = amountInr * 100;
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
      amountInr,
      paymentPlan,
      catalogPriceInr: course.price_inr,
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
