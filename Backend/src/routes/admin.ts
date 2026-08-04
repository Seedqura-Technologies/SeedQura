import { Router } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";
import {
  requireAuth,
  requireAdmin,
  type AuthedRequest,
} from "../middleware/auth.js";
import { createNotification } from "../lib/notifications.js";
import { enrollmentDecisionEmail, sendMail } from "../lib/mail.js";
import {
  syncSessionCalendarAndNotify,
  type SessionRow,
} from "../lib/sessions.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/stats", async (_req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const [students, courses, enrollments, paid] = await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "student"),
      admin.from("courses").select("id", { count: "exact", head: true }),
      admin.from("enrollments").select("id", { count: "exact", head: true }),
      admin
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "paid"),
    ]);
    res.json({
      students: students.count ?? 0,
      courses: courses.count ?? 0,
      enrollments: enrollments.count ?? 0,
      paidEnrollments: paid.count ?? 0,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

adminRouter.get("/students", async (req: AuthedRequest, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const status = String(req.query.status || "").trim();
    const admin = getSupabaseAdmin();
    let query = admin
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false });
    if (status === "active" || status === "suspended") {
      query = query.eq("status", status);
    }
    const { data, error } = await query;
    if (error) throw error;
    let students = data ?? [];
    if (q) {
      students = students.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }
    res.json({ students });
  } catch (err) {
    console.error("[admin/students]", err);
    res.status(500).json({ error: "Failed to list students" });
  }
});

adminRouter.get("/students/:id", async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const { data: student, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!student) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { data: enrollments } = await admin
      .from("enrollments")
      .select("*, course:courses(*), payments(*)")
      .eq("user_id", student.id)
      .order("created_at", { ascending: false });
    res.json({ student, enrollments: enrollments ?? [] });
  } catch (err) {
    console.error("[admin/students/:id]", err);
    res.status(500).json({ error: "Failed to load student" });
  }
});

adminRouter.patch("/students/:id", async (req, res) => {
  try {
    const status = req.body?.status;
    if (status !== "active" && status !== "suspended") {
      res.status(400).json({ error: "status must be active|suspended" });
      return;
    }
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    res.json({ student: data });
  } catch (err) {
    console.error("[admin/students patch]", err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

adminRouter.get("/courses", async (_req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("courses")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    res.json({ courses: data ?? [] });
  } catch (err) {
    console.error("[admin/courses]", err);
    res.status(500).json({ error: "Failed to list courses" });
  }
});

adminRouter.post("/courses", async (req, res) => {
  try {
    const body = req.body || {};
    const id = String(body.id || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-");
    if (!id || !body.name) {
      res.status(400).json({ error: "id and name required" });
      return;
    }
    const admin = getSupabaseAdmin();
    const row = {
      id,
      name: String(body.name),
      tagline: String(body.tagline || ""),
      description: String(body.description || ""),
      category: String(body.category || "Course"),
      level: String(body.level || ""),
      duration: String(body.duration || ""),
      format: String(body.format || ""),
      schedule_summary: String(body.schedule_summary || ""),
      price_inr:
        body.price_inr === null || body.price_inr === ""
          ? null
          : Number(body.price_inr),
      currency: String(body.currency || "INR"),
      price_display: String(body.price_display || ""),
      banner_url: body.banner_url || null,
      status: body.status || "draft",
      display_status: String(body.display_status || "Open"),
      seat_limit:
        body.seat_limit === null || body.seat_limit === ""
          ? null
          : Number(body.seat_limit),
      registration_deadline: body.registration_deadline || null,
      featured: Boolean(body.featured),
      features: Array.isArray(body.features) ? body.features : [],
    };
    const { data, error } = await admin
      .from("courses")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    res.status(201).json({ course: data });
  } catch (err) {
    console.error("[admin/courses post]", err);
    res.status(500).json({ error: "Failed to create course" });
  }
});

adminRouter.patch("/courses/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    const fields = [
      "name",
      "tagline",
      "description",
      "category",
      "level",
      "duration",
      "format",
      "schedule_summary",
      "currency",
      "price_display",
      "banner_url",
      "status",
      "display_status",
      "registration_deadline",
      "featured",
      "features",
    ] as const;
    for (const f of fields) {
      if (body[f] !== undefined) patch[f] = body[f];
    }
    if (body.price_inr !== undefined) {
      patch.price_inr =
        body.price_inr === null || body.price_inr === ""
          ? null
          : Number(body.price_inr);
    }
    if (body.seat_limit !== undefined) {
      patch.seat_limit =
        body.seat_limit === null || body.seat_limit === ""
          ? null
          : Number(body.seat_limit);
    }
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("courses")
      .update(patch)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    res.json({ course: data });
  } catch (err) {
    console.error("[admin/courses patch]", err);
    res.status(500).json({ error: "Failed to update course" });
  }
});

adminRouter.delete("/courses/:id", async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("courses")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin/courses delete]", err);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

adminRouter.get("/enrollments", async (req, res) => {
  try {
    const status = String(req.query.status || "").trim();
    const paymentStatus = String(req.query.payment_status || "paid").trim();
    const admin = getSupabaseAdmin();
    let query = admin
      .from("enrollments")
      .select(
        "*, course:courses(id, name), profile:profiles(id, full_name, email), payments(*)"
      )
      .order("created_at", { ascending: false });

    // Default: only successfully paid enrollments
    if (paymentStatus && paymentStatus !== "all") {
      query = query.eq("payment_status", paymentStatus);
    }
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ enrollments: data ?? [] });
  } catch (err) {
    console.error("[admin/enrollments]", err);
    res.status(500).json({ error: "Failed to list enrollments" });
  }
});

adminRouter.patch("/enrollments/:id", async (req, res) => {
  try {
    const status = req.body?.status;
    if (!["active", "rejected", "pending_payment", "refunded"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const admin = getSupabaseAdmin();
    const { data: enrollment, error } = await admin
      .from("enrollments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*, course:courses(name), profile:profiles(full_name, email)")
      .single();
    if (error) throw error;

    if (status === "active" || status === "rejected") {
      const email = (enrollment as any).profile?.email;
      const name = (enrollment as any).profile?.full_name || "";
      const courseName = (enrollment as any).course?.name || "";
      if (email) {
        const mail = enrollmentDecisionEmail(
          name,
          courseName,
          status === "active" ? "approved" : "rejected"
        );
        await sendMail({ to: email, ...mail });
      }
      await createNotification({
        userId: enrollment.user_id,
        type: status === "active" ? "enrollment_approved" : "enrollment_rejected",
        title:
          status === "active" ? "Enrollment approved" : "Enrollment rejected",
        body: `${courseName}`,
        metadata: { enrollmentId: enrollment.id },
      });
    }

    res.json({ enrollment });
  } catch (err) {
    console.error("[admin/enrollments patch]", err);
    res.status(500).json({ error: "Failed to update enrollment" });
  }
});

// ---------------------------------------------------------------------------
// Course sessions (Phase 2)
// ---------------------------------------------------------------------------

adminRouter.get("/courses/:courseId/sessions", async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("course_sessions")
      .select("*")
      .eq("course_id", req.params.courseId)
      .order("starts_at", { ascending: true });
    if (error) throw error;
    res.json({ sessions: data ?? [] });
  } catch (err) {
    console.error("[admin/sessions list]", err);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

adminRouter.post("/courses/:courseId/sessions", async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    const starts_at = String(body.starts_at || "").trim();
    const ends_at = String(body.ends_at || "").trim();
    if (!title || !starts_at || !ends_at) {
      res.status(400).json({ error: "title, starts_at, ends_at required" });
      return;
    }
    if (new Date(ends_at) <= new Date(starts_at)) {
      res.status(400).json({ error: "ends_at must be after starts_at" });
      return;
    }

    const admin = getSupabaseAdmin();
    const { data: course } = await admin
      .from("courses")
      .select("id, name")
      .eq("id", req.params.courseId)
      .maybeSingle();
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const row = {
      course_id: course.id,
      title,
      description: String(body.description || ""),
      instructor_name: String(body.instructor_name || ""),
      starts_at,
      ends_at,
      meeting_url: body.meeting_url || null,
      location: String(body.location || ""),
      status: "scheduled",
    };

    const { data: session, error } = await admin
      .from("course_sessions")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;

    const notify = await syncSessionCalendarAndNotify({
      session: session as SessionRow,
      courseName: course.name,
      action: "created",
    });

    const { data: refreshed } = await admin
      .from("course_sessions")
      .select("*")
      .eq("id", session.id)
      .single();

    res.status(201).json({
      session: refreshed || session,
      notified: notify.notified,
      googleEventId: notify.googleEventId,
    });
  } catch (err) {
    console.error("[admin/sessions post]", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

adminRouter.patch("/sessions/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const admin = getSupabaseAdmin();
    const { data: existing, error: findErr } = await admin
      .from("course_sessions")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!existing) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const f of [
      "title",
      "description",
      "instructor_name",
      "starts_at",
      "ends_at",
      "meeting_url",
      "location",
      "status",
    ] as const) {
      if (body[f] !== undefined) patch[f] = body[f];
    }

    const starts = String(patch.starts_at ?? existing.starts_at);
    const ends = String(patch.ends_at ?? existing.ends_at);
    if (new Date(ends) <= new Date(starts)) {
      res.status(400).json({ error: "ends_at must be after starts_at" });
      return;
    }

    const { data: session, error } = await admin
      .from("course_sessions")
      .update(patch)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;

    const { data: course } = await admin
      .from("courses")
      .select("name")
      .eq("id", session.course_id)
      .maybeSingle();

    const action =
      session.status === "cancelled" ? "cancelled" : ("updated" as const);

    const notify = await syncSessionCalendarAndNotify({
      session: session as SessionRow,
      courseName: course?.name || session.course_id,
      action,
    });

    const { data: refreshed } = await admin
      .from("course_sessions")
      .select("*")
      .eq("id", session.id)
      .single();

    res.json({
      session: refreshed || session,
      notified: notify.notified,
      googleEventId: notify.googleEventId,
    });
  } catch (err) {
    console.error("[admin/sessions patch]", err);
    res.status(500).json({ error: "Failed to update session" });
  }
});

adminRouter.delete("/sessions/:id", async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const { data: existing, error: findErr } = await admin
      .from("course_sessions")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!existing) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const { data: course } = await admin
      .from("courses")
      .select("name")
      .eq("id", existing.course_id)
      .maybeSingle();

    const cancelled = {
      ...(existing as SessionRow),
      status: "cancelled",
    };
    await syncSessionCalendarAndNotify({
      session: cancelled,
      courseName: course?.name || existing.course_id,
      action: "cancelled",
    });

    const { error } = await admin
      .from("course_sessions")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin/sessions delete]", err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});
