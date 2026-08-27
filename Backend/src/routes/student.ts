import { Router } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  createNotification,
  formatStudentNotification,
} from "../lib/notifications.js";
import { sendMail, welcomeEmail } from "../lib/mail.js";

export const studentRouter = Router();

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3020"
  ).replace(/\/$/, "");
}

/** Register via backend (no Supabase auth email). Welcome mail goes through Resend only. */
studentRouter.post("/register", rateLimit("welcome"), async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    const fullName = String(req.body?.fullName || "").trim();

    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const admin = getSupabaseAdmin();

    const existingProfile = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existingProfile.data) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip Supabase confirmation email
      user_metadata: { full_name: fullName, role: "student" },
    });
    if (created.error || !created.data.user) {
      const msg = created.error?.message || "Failed to create account";
      const status = /already|registered|exists/i.test(msg) ? 409 : 400;
      res.status(status).json({ error: msg });
      return;
    }

    const userId = created.data.user.id;
    await admin.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      role: "student",
      status: "active",
    });

    // Respond immediately — mail + in-app notification are non-blocking
    res.json({
      ok: true,
      userId,
      mailed: true,
    });

    void (async () => {
      try {
        const mail = welcomeEmail({
          name: fullName,
          email,
          password,
          loginUrl: `${siteUrl()}/login`,
        });
        const sent = await sendMail({ to: email, ...mail });
        if (!sent.ok) {
          console.error("[register] Resend failed", sent.error);
        }
        await createNotification({
          userId,
          type: "welcome",
          title: "Welcome to Seedqura",
          body: "Your account is ready. Check your email for login details.",
        });
      } catch (err) {
        console.error("[register] post-create notify failed", err);
      }
    })();
  } catch (err) {
    console.error("[student/register]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

/** @deprecated Prefer /register — kept for idempotent credential resend after signup. */
studentRouter.post(
  "/welcome-email",
  rateLimit("welcome"),
  async (req, res) => {
    try {
      const email = String(req.body?.email || "")
        .trim()
        .toLowerCase();
      const password = String(req.body?.password || "");
      const fullName = String(req.body?.fullName || "").trim();

      if (!email || !password) {
        res.status(400).json({ error: "email and password required" });
        return;
      }

      const admin = getSupabaseAdmin();

      let { data: profile } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .ilike("email", email)
        .maybeSingle();

      if (!profile) {
        const listed = await admin.auth.admin.listUsers({ perPage: 200 });
        const user = listed.data.users.find(
          (u) => u.email?.toLowerCase() === email
        );
        if (!user) {
          const mail = welcomeEmail({
            name: fullName,
            email,
            password,
            loginUrl: `${siteUrl()}/login`,
          });
          await sendMail({ to: email, ...mail });
          res.json({ ok: true, pendingProfile: true });
          return;
        }
        await admin.from("profiles").upsert({
          id: user.id,
          email,
          full_name:
            fullName ||
            (user.user_metadata?.full_name as string | undefined) ||
            "",
          role: "student",
          status: "active",
        });
        profile = {
          id: user.id,
          full_name:
            fullName ||
            (user.user_metadata?.full_name as string | undefined) ||
            "",
          email,
        };
      }

      const { data: already } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", profile.id)
        .eq("type", "welcome")
        .limit(1);
      if (already && already.length > 0) {
        res.json({ ok: true, skipped: true });
        return;
      }

      const mail = welcomeEmail({
        name: fullName || profile.full_name || "",
        email,
        password,
        loginUrl: `${siteUrl()}/login`,
      });
      const sent = await sendMail({ to: email, ...mail });

      await createNotification({
        userId: profile.id,
        type: "welcome",
        title: "Welcome to Seedqura",
        body: "Your account is ready. Check your email for login details.",
      });

      res.json({ ok: true, mailed: !sent.skipped, id: sent.id });
    } catch (err) {
      console.error("[student/welcome-email]", err);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  }
);

studentRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const admin = getSupabaseAdmin();
    const baseProfile = req.profile!;

    const enrollmentsSelect =
      "id, status, payment_status, progress_pct, course_id, created_at, course:courses(id, name, description, duration, schedule_summary, price_display, price_inr, display_status, featured)";
    const notificationsSelect =
      "id, title, body, read_at, created_at, type, metadata";

    const [enrollmentsResult, notificationsResult, profileResult] =
      await Promise.all([
      admin
        .from("enrollments")
        .select(enrollmentsSelect)
        .eq("user_id", req.userId!)
        .order("created_at", { ascending: false }),
      admin
        .from("notifications")
        .select(notificationsSelect)
        .eq("user_id", req.userId!)
        .order("created_at", { ascending: false })
        .limit(30),
      admin
        .from("profiles")
        .select("id, full_name, email, role, phone")
        .eq("id", req.userId!)
        .maybeSingle(),
    ]);

    const profile = {
      ...baseProfile,
      phone: profileResult.data?.phone ?? null,
      full_name: profileResult.data?.full_name ?? baseProfile.full_name,
      email: profileResult.data?.email ?? baseProfile.email,
    };

    if (enrollmentsResult.error) throw enrollmentsResult.error;

    const enrollments = enrollmentsResult.data ?? [];
    const notifications = notificationsResult.data ?? [];

    const activeCourseIds = enrollments
      .filter((e) => e.status === "active" && e.payment_status === "paid")
      .map((e) => e.course_id)
      .filter(Boolean);

    let upcomingSessions: unknown[] = [];
    if (activeCourseIds.length > 0) {
      const { data: sessions } = await admin
        .from("course_sessions")
        .select(
          "id, title, starts_at, ends_at, meeting_url, instructor_name, course_id, schedule_rule_id, schedule_rule:course_schedule_rules!schedule_rule_id(status), course:courses(id, name)"
        )
        .in("course_id", activeCourseIds)
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(40);

      // One-time sessions (no rule) or sessions under a published schedule only
      upcomingSessions = (sessions ?? [])
        .filter((s) => {
          if (!s.schedule_rule_id) return true;
          const rule = s.schedule_rule as
            | { status: string }
            | { status: string }[]
            | null;
          const status = Array.isArray(rule) ? rule[0]?.status : rule?.status;
          return status === "published";
        })
        .slice(0, 20)
        .map(({ schedule_rule: _r, ...rest }) => rest);
    }

    const unread = notifications.filter((n) => !n.read_at).length;

    const profileComplete = Boolean(
      profile.full_name?.trim() && profile.email
    );

    res.json({
      profile,
      enrollments,
      notifications: notifications.map(formatStudentNotification),
      unreadCount: unread,
      profileComplete,
      upcomingSessions,
    });
  } catch (err) {
    console.error("[student/me]", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

studentRouter.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const full_name = String(req.body?.full_name ?? "").trim();
    const phone = String(req.body?.phone ?? "").trim();
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .update({
        full_name,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.userId!)
      .select("*")
      .single();
    if (error) throw error;
    res.json({ profile: data });
  } catch (err) {
    console.error("[student/me patch]", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

studentRouter.post(
  "/notifications/:id/read",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      const admin = getSupabaseAdmin();
      await admin
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .eq("user_id", req.userId!);
      res.json({ ok: true });
    } catch (err) {
      console.error("[notifications]", err);
      res.status(500).json({ error: "Failed to mark read" });
    }
  }
);

studentRouter.post(
  "/notifications/read-all",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      const admin = getSupabaseAdmin();
      await admin
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", req.userId!)
        .is("read_at", null);
      res.json({ ok: true });
    } catch (err) {
      console.error("[notifications]", err);
      res.status(500).json({ error: "Failed to mark read" });
    }
  }
);
