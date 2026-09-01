import type { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
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
import { invalidateFellowshipAllowListCache } from "../lib/fellowship-gate.js";
import { sendFellowshipOfferEmail } from "../lib/fellowship-offer-mail.js";

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
}
