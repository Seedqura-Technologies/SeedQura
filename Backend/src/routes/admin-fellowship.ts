import type { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import {
  addFellowshipSelection,
  countActiveFellowshipSelections,
  FELLOWSHIP_SEAT_CAP,
  fellowshipSchemaSetupMessage,
  isFellowshipSchemaError,
  listActiveFellowshipSelections,
  normalizeFellowshipEmail,
  revokeFellowshipSelection,
} from "../lib/fellowship-selections.js";
import {
  invalidateFellowshipAllowListCache,
  RESEARCH_FELLOWSHIP_ID,
  RESEARCH_FELLOWSHIP_MONTHLY_INR,
} from "../lib/fellowship-gate.js";
import { sendFellowshipOfferEmail } from "../lib/fellowship-offer-mail.js";
import {
  addDaysIso,
  nextInstallmentNumber,
  RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT,
  RESEARCH_FELLOWSHIP_REMINDER_COOLDOWN_DAYS,
  RESEARCH_FELLOWSHIP_REMINDER_WINDOW_DAYS,
} from "../lib/fellowship-installments.js";
import {
  fellowshipInstallmentReminderEmail,
  sendMail,
} from "../lib/mail.js";
import { createNotification } from "../lib/notifications.js";

export function registerAdminFellowshipRoutes(adminRouter: Router): void {
  adminRouter.get("/fellowship-selections", async (_req, res) => {
    try {
      const selections = await listActiveFellowshipSelections();
      res.json({
        selections,
        seatCount: selections.length,
        seatCap: FELLOWSHIP_SEAT_CAP,
      });
    } catch (err) {
      console.error("[admin/fellowship-selections GET]", err);
      if (isFellowshipSchemaError(err)) {
        res.status(503).json({
          error: fellowshipSchemaSetupMessage(),
          code: "FELLOWSHIP_SCHEMA_MISSING",
        });
        return;
      }
      res.status(500).json({ error: "Failed to load fellowship selections" });
    }
  });

  adminRouter.post("/fellowship-selections", async (req: AuthedRequest, res) => {
    try {
      const email = String(req.body?.email || "");
      const fullName =
        typeof req.body?.fullName === "string" ? req.body.fullName : undefined;
      const notes =
        typeof req.body?.notes === "string" ? req.body.notes : undefined;
      const sendEmail = req.body?.sendEmail !== false;

      if (!email.trim()) {
        res.status(400).json({ error: "email required" });
        return;
      }

      const seatCount = await countActiveFellowshipSelections();
      const normalized = normalizeFellowshipEmail(email);
      const active = await listActiveFellowshipSelections();
      const alreadySelected = active.some((r) => r.email === normalized);

      if (!alreadySelected && seatCount >= FELLOWSHIP_SEAT_CAP) {
        res.status(400).json({
          error: `Seat cap reached (${FELLOWSHIP_SEAT_CAP}). Revoke someone before adding a new selection.`,
        });
        return;
      }

      const row = await addFellowshipSelection({
        email,
        fullName,
        notes,
        selectedBy: req.userId!,
      });
      invalidateFellowshipAllowListCache();

      let emailResult: Awaited<ReturnType<typeof sendFellowshipOfferEmail>> | null =
        null;
      if (sendEmail) {
        emailResult = await sendFellowshipOfferEmail({
          email: row.email,
          name: row.full_name,
        });
        if (emailResult.status === "sent") {
          row.selection_email_sent_at = new Date().toISOString();
        } else {
          console.error("[admin/fellowship-selections POST] offer email", emailResult);
        }
      }

      res.status(201).json({
        selection: row,
        email: emailResult,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add selection";
      console.error("[admin/fellowship-selections POST]", err);
      if (isFellowshipSchemaError(err)) {
        res.status(503).json({
          error: fellowshipSchemaSetupMessage(),
          code: "FELLOWSHIP_SCHEMA_MISSING",
        });
        return;
      }
      res.status(message === "Invalid email" ? 400 : 500).json({ error: message });
    }
  });

  adminRouter.post(
    "/fellowship-selections/:email/resend-email",
    async (req: AuthedRequest, res) => {
      try {
        const email = decodeURIComponent(String(req.params.email || ""));
        if (!email.trim()) {
          res.status(400).json({ error: "email required" });
          return;
        }

        const normalized = normalizeFellowshipEmail(email);
        const active = await listActiveFellowshipSelections();
        const row = active.find((r) => r.email === normalized);
        if (!row) {
          res.status(404).json({
            error: "Candidate is not on the active fellowship allow-list.",
          });
          return;
        }

        const emailResult = await sendFellowshipOfferEmail({
          email: row.email,
          name: row.full_name,
        });

        if (emailResult.status !== "sent") {
          console.error("[admin/fellowship-selections resend]", emailResult);
          res.status(502).json({
            error: emailResult.message,
            email: emailResult,
          });
          return;
        }

        res.json({
          ok: true,
          email: emailResult,
          selection_email_sent_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[admin/fellowship-selections resend]", err);
        if (isFellowshipSchemaError(err)) {
          res.status(503).json({
            error: fellowshipSchemaSetupMessage(),
            code: "FELLOWSHIP_SCHEMA_MISSING",
          });
          return;
        }
        res.status(500).json({ error: "Failed to resend offer email" });
      }
    }
  );

  adminRouter.delete(
    "/fellowship-selections/:email",
    async (req: AuthedRequest, res) => {
      try {
        const email = decodeURIComponent(String(req.params.email || ""));
        if (!email.trim()) {
          res.status(400).json({ error: "email required" });
          return;
        }
        await revokeFellowshipSelection(email);
        invalidateFellowshipAllowListCache();
        res.json({ ok: true });
      } catch (err) {
        console.error("[admin/fellowship-selections DELETE]", err);
        if (isFellowshipSchemaError(err)) {
          res.status(503).json({
            error: fellowshipSchemaSetupMessage(),
            code: "FELLOWSHIP_SCHEMA_MISSING",
          });
          return;
        }
        res.status(500).json({ error: "Failed to revoke selection" });
      }
    }
  );

  /** Send due/overdue monthly installment reminders (safe to run daily). */
  adminRouter.post(
    "/fellowship-installment-reminders",
    async (_req: AuthedRequest, res) => {
      try {
        const admin = getSupabaseAdmin();
        const now = new Date();
        const windowEnd = addDaysIso(
          now,
          RESEARCH_FELLOWSHIP_REMINDER_WINDOW_DAYS
        );
        const cooldownBefore = addDaysIso(
          now,
          -RESEARCH_FELLOWSHIP_REMINDER_COOLDOWN_DAYS
        );

        const { data: rows, error } = await admin
          .from("enrollments")
          .select(
            "id, user_id, installments_paid, installments_total, installment_amount_inr, next_installment_due_at, installment_reminder_sent_at, applicant_name, profile:profiles(full_name, email)"
          )
          .eq("course_id", RESEARCH_FELLOWSHIP_ID)
          .eq("payment_status", "partial")
          .eq("payment_plan", "monthly")
          .not("next_installment_due_at", "is", null)
          .lte("next_installment_due_at", windowEnd);

        if (error) throw error;

        const site =
          process.env.NEXT_PUBLIC_SITE_URL || "https://www.seedqura.com";
        const payUrl = `${site}/enroll/${RESEARCH_FELLOWSHIP_ID}#pay`;
        let sent = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const row of rows || []) {
          const reminderAt = row.installment_reminder_sent_at
            ? new Date(row.installment_reminder_sent_at).getTime()
            : 0;
          if (reminderAt && reminderAt > new Date(cooldownBefore).getTime()) {
            skipped += 1;
            continue;
          }

          const profile = Array.isArray(row.profile)
            ? row.profile[0]
            : row.profile;
          const email = profile?.email;
          if (!email) {
            skipped += 1;
            continue;
          }

          const name =
            profile?.full_name || row.applicant_name || "there";
          const installmentNumber = nextInstallmentNumber({
            payment_plan: "monthly",
            installments_total:
              row.installments_total || RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT,
            installments_paid: row.installments_paid || 0,
            installment_amount_inr:
              row.installment_amount_inr || RESEARCH_FELLOWSHIP_MONTHLY_INR,
            next_installment_due_at: row.next_installment_due_at,
            payment_status: "partial",
            status: "active",
          });
          const total =
            Number(row.installments_total) ||
            RESEARCH_FELLOWSHIP_INSTALLMENT_COUNT;
          const amountInr =
            Number(row.installment_amount_inr) ||
            RESEARCH_FELLOWSHIP_MONTHLY_INR;

          try {
            const mail = fellowshipInstallmentReminderEmail({
              name,
              installmentNumber,
              installmentsTotal: total,
              amountInr,
              dueAt: row.next_installment_due_at,
              payUrl,
            });
            await sendMail({ to: email, ...mail });
            await createNotification({
              userId: row.user_id,
              type: "payment_reminder",
              title: `Installment ${installmentNumber} of ${total} due`,
              body: `Pay ₹${amountInr.toLocaleString("en-IN")} for your Research Fellowship.`,
              metadata: {
                courseId: RESEARCH_FELLOWSHIP_ID,
                enrollmentId: row.id,
                installmentNumber,
              },
            });
            await admin
              .from("enrollments")
              .update({
                installment_reminder_sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", row.id);
            sent += 1;
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "reminder failed";
            errors.push(`${email}: ${message}`);
          }
        }

        res.json({
          ok: true,
          candidates: (rows || []).length,
          sent,
          skipped,
          errors,
        });
      } catch (err) {
        console.error("[admin/fellowship-installment-reminders]", err);
        res.status(500).json({ error: "Failed to send installment reminders" });
      }
    }
  );
}
