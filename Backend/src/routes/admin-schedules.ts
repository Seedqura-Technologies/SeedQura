import type { Router, Response } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  ScheduleGeneratorError,
  assertValidScheduleInput,
  buildSchedulePreview,
  materializeScheduleSessions,
  normalizeDaysOfWeek,
  type ScheduleGenerateInput,
} from "../lib/schedule-generator.js";
import { publishScheduleRule } from "../lib/schedule-publish.js";
import { deliverSessionCalendarInvites } from "../lib/sessions.js";
import { isHttpUrl } from "../lib/url.js";
import { rateLimit } from "../middleware/rateLimit.js";

export type ScheduleRuleRow = {
  id: string;
  course_id: string;
  start_date: string;
  end_date: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  timezone: string;
  title: string;
  instructor_name: string;
  meeting_url: string | null;
  location: string;
  description: string;
  status: string;
  created_by: string | null;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
};

type ScheduleCounts = {
  session_count: number;
  future_session_count: number;
  completed_session_count: number;
  cancelled_session_count: number;
};

function badRequest(res: Response, error: string) {
  res.status(400).json({ error });
}

function notFound(res: Response, error: string) {
  res.status(404).json({ error });
}

function asYmd(value: unknown): string {
  if (typeof value !== "string") return "";
  // Postgres date may arrive as ISO datetime via some drivers
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return value.trim();
}

function asTime(value: unknown): string {
  if (typeof value !== "string") return "";
  const t = value.trim();
  if (/^\d{2}:\d{2}:\d{2}/.test(t)) return t.slice(0, 8);
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}

export function ruleToGenerateInput(rule: ScheduleRuleRow): ScheduleGenerateInput {
  return {
    courseId: rule.course_id,
    scheduleRuleId: rule.id,
    startDate: asYmd(rule.start_date),
    endDate: asYmd(rule.end_date),
    daysOfWeek: rule.days_of_week,
    startTime: asTime(rule.start_time),
    endTime: asTime(rule.end_time),
    timezone: rule.timezone,
    title: rule.title,
    instructor: rule.instructor_name,
    meetingUrl: rule.meeting_url,
    location: rule.location,
    description: rule.description,
  };
}

function parseCreateBody(body: Record<string, unknown>, courseId: string) {
  const title = String(body.title ?? "").trim();
  const timezone = String(body.timezone ?? "Asia/Kolkata").trim();
  const startDate = asYmd(body.start_date ?? body.startDate);
  const endDate = asYmd(body.end_date ?? body.endDate);
  const startTime = String(body.start_time ?? body.startTime ?? "").trim();
  const endTime = String(body.end_time ?? body.endTime ?? "").trim();
  const daysRaw = (body.days_of_week ?? body.daysOfWeek) as
    | Array<number | string>
    | undefined;
  const instructor = String(
    body.instructor_name ?? body.instructor ?? ""
  ).trim();
  const location = String(body.location ?? "").trim();
  const description = String(body.description ?? "").trim();
  const meetingRaw = body.meeting_url ?? body.meetingUrl;
  const meetingUrl =
    meetingRaw == null || String(meetingRaw).trim() === ""
      ? null
      : String(meetingRaw).trim();

  if (!title) throw new ScheduleGeneratorError("title is required");
  if (meetingUrl && !isHttpUrl(meetingUrl)) {
    throw new ScheduleGeneratorError(
      "meeting_url must be a valid http(s) URL when provided"
    );
  }

  const days = normalizeDaysOfWeek(daysRaw ?? []);
  const { startTime: st, endTime: et } = assertValidScheduleInput({
    courseId,
    scheduleRuleId: "00000000-0000-0000-0000-000000000001",
    startDate,
    endDate,
    daysOfWeek: days,
    startTime,
    endTime,
    timezone,
    title,
    instructor,
    meetingUrl,
    location,
    description,
  });

  return {
    title,
    timezone,
    start_date: startDate,
    end_date: endDate,
    start_time: st,
    end_time: et,
    days_of_week: days,
    instructor_name: instructor,
    location,
    description,
    meeting_url: meetingUrl,
  };
}

async function getSessionCounts(ruleId: string): Promise<ScheduleCounts> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("course_sessions")
    .select("id, status, starts_at, ends_at")
    .eq("schedule_rule_id", ruleId);
  if (error) throw error;

  const rows = data ?? [];
  let future = 0;
  let completed = 0;
  let cancelled = 0;
  for (const row of rows) {
    if (row.status === "cancelled") {
      cancelled += 1;
      continue;
    }
    if (row.status === "completed" || row.ends_at < nowIso) {
      completed += 1;
      continue;
    }
    if (row.status === "scheduled" && row.starts_at >= nowIso) {
      future += 1;
    } else if (row.status === "scheduled") {
      // started but not marked completed — count as historical/in-progress preserved
      completed += 1;
    }
  }
  return {
    session_count: rows.length,
    future_session_count: future,
    completed_session_count: completed,
    cancelled_session_count: cancelled,
  };
}

async function serializeSchedule(rule: ScheduleRuleRow) {
  const counts = await getSessionCounts(rule.id);
  return {
    ...rule,
    start_date: asYmd(rule.start_date),
    end_date: asYmd(rule.end_date),
    start_time: asTime(rule.start_time),
    end_time: asTime(rule.end_time),
    ...counts,
  };
}

async function courseNameForId(courseId: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("courses")
    .select("name")
    .eq("id", courseId)
    .maybeSingle();
  return data?.name || courseId;
}

/**
 * Cancel future scheduled occurrences for a rule.
 * Preserves completed, cancelled, and past sessions.
 */
async function cancelFutureScheduledSessions(
  ruleId: string,
  courseName: string
): Promise<{
  cancelled: number;
  preserved: number;
}> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: all, error: listErr } = await admin
    .from("course_sessions")
    .select(
      "id, status, starts_at, course_id, title, description, instructor_name, ends_at, meeting_url, location, google_event_id, calendar_sync_status, calendar_event_status"
    )
    .eq("schedule_rule_id", ruleId);
  if (listErr) throw listErr;

  const future = (all ?? []).filter(
    (s) => s.status === "scheduled" && s.starts_at >= nowIso
  );
  const preserved = (all ?? []).length - future.length;

  for (const session of future) {
    if (session.google_event_id) {
      await deliverSessionCalendarInvites({
        session: session as Parameters<typeof deliverSessionCalendarInvites>[0]["session"],
        courseName,
        action: "cancel",
      });
    }
  }

  const futureIds = future.map((s) => s.id);
  if (futureIds.length === 0) {
    return { cancelled: 0, preserved };
  }

  const { error } = await admin
    .from("course_sessions")
    .update({
      status: "cancelled",
      calendar_event_status: "cancelled",
      calendar_sync_status: "cancelled",
      updated_at: nowIso,
    })
    .in("id", futureIds);
  if (error) throw error;

  return { cancelled: futureIds.length, preserved };
}

function structuralChanged(
  before: ScheduleRuleRow,
  patch: Partial<ScheduleRuleRow>
): boolean {
  const keys = [
    "start_date",
    "end_date",
    "days_of_week",
    "start_time",
    "end_time",
    "timezone",
  ] as const;
  for (const key of keys) {
    if (patch[key] === undefined) continue;
    if (key === "days_of_week") {
      const a = [...(before.days_of_week ?? [])].sort().join(",");
      const b = [...((patch.days_of_week as number[]) ?? [])].sort().join(",");
      if (a !== b) return true;
      continue;
    }
    if (key === "start_date" || key === "end_date") {
      if (asYmd(String(before[key])) !== asYmd(String(patch[key]))) return true;
      continue;
    }
    if (key === "start_time" || key === "end_time") {
      if (asTime(String(before[key])) !== asTime(String(patch[key]))) return true;
      continue;
    }
    if (String(before[key]) !== String(patch[key])) return true;
  }
  return false;
}

async function applyMetadataToFutureSessions(
  rule: ScheduleRuleRow
): Promise<number> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("course_sessions")
    .update({
      title: rule.title,
      instructor_name: rule.instructor_name,
      meeting_url: rule.meeting_url,
      location: rule.location,
      description: rule.description,
      updated_at: nowIso,
    })
    .eq("schedule_rule_id", rule.id)
    .eq("status", "scheduled")
    .gte("starts_at", nowIso)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export function registerAdminScheduleRoutes(router: Router) {
  /**
   * POST /courses/:courseId/schedules/preview
   * Dry-run expansion — no DB writes. Registered before create route.
   */
  router.post(
    "/courses/:courseId/schedules/preview",
    async (req, res) => {
      try {
        const courseId = String(req.params.courseId || "").trim();
        const body = (req.body || {}) as Record<string, unknown>;
        const admin = getSupabaseAdmin();

        const { data: course, error: courseErr } = await admin
          .from("courses")
          .select("id")
          .eq("id", courseId)
          .maybeSingle();
        if (courseErr) throw courseErr;
        if (!course) {
          notFound(res, "Course not found");
          return;
        }

        const startDate = asYmd(body.start_date ?? body.startDate);
        const endDate = asYmd(body.end_date ?? body.endDate);
        const startTime = String(body.start_time ?? body.startTime ?? "").trim();
        const endTime = String(body.end_time ?? body.endTime ?? "").trim();
        const timezone = String(
          body.timezone ?? "Asia/Kolkata"
        ).trim();
        const daysRaw = (body.days_of_week ?? body.daysOfWeek) as
          | Array<number | string>
          | undefined;

        let preview;
        try {
          preview = buildSchedulePreview({
            courseId,
            startDate,
            endDate,
            startTime,
            endTime,
            timezone,
            daysOfWeek: daysRaw ?? [],
          });
        } catch (err) {
          badRequest(
            res,
            err instanceof ScheduleGeneratorError
              ? err.message
              : "Invalid schedule preview payload"
          );
          return;
        }

        res.json({
          course_id: courseId,
          total_sessions: preview.total_sessions,
          timezone: preview.timezone,
          dates: preview.dates,
          sessions: preview.sessions,
        });
      } catch (err) {
        console.error("[admin/schedules preview]", err);
        res.status(500).json({ error: "Failed to preview schedule" });
      }
    }
  );

  /** POST /courses/:courseId/schedules */
  router.post(
    "/courses/:courseId/schedules",
    async (req: AuthedRequest, res) => {
      try {
        const courseId = String(req.params.courseId || "").trim();
        const body = (req.body || {}) as Record<string, unknown>;
        const generate =
          body.generate === true ||
          body.generate === "true" ||
          body.generate_sessions === true;

        const admin = getSupabaseAdmin();
        const { data: course, error: courseErr } = await admin
          .from("courses")
          .select("id, name")
          .eq("id", courseId)
          .maybeSingle();
        if (courseErr) throw courseErr;
        if (!course) {
          notFound(res, "Course not found");
          return;
        }

        let parsed;
        try {
          parsed = parseCreateBody(body, courseId);
        } catch (err) {
          const msg =
            err instanceof ScheduleGeneratorError
              ? err.message
              : "Invalid schedule payload";
          badRequest(res, msg);
          return;
        }

        const { data: rule, error } = await admin
          .from("course_schedule_rules")
          .insert({
            course_id: courseId,
            ...parsed,
            status: "draft",
            created_by: req.userId ?? null,
            updated_at: new Date().toISOString(),
          })
          .select("*")
          .single();
        if (error) throw error;

        // Generate sessions into draft only — no calendar / email until publish
        let generated = null;
        if (generate) {
          generated = await materializeScheduleSessions(
            ruleToGenerateInput(rule as ScheduleRuleRow)
          );
        }

        res.status(201).json({
          schedule: await serializeSchedule(rule as ScheduleRuleRow),
          generated: generated
            ? {
                sessions: generated.sessions,
                createdCount: generated.createdCount,
                skippedCount: generated.skippedCount,
                totalExpanded: generated.totalExpanded,
              }
            : null,
          note: generate
            ? "Draft schedule created with sessions. Review, then POST /api/admin/schedules/:id/publish to notify students and sync calendars."
            : "Draft schedule created. Call generate, review, then publish.",
        });
      } catch (err) {
        if (err instanceof ScheduleGeneratorError) {
          badRequest(res, err.message);
          return;
        }
        console.error("[admin/schedules post]", err);
        res.status(500).json({ error: "Failed to create schedule" });
      }
    }
  );

  /** GET /courses/:courseId/schedules */
  router.get("/courses/:courseId/schedules", async (req, res) => {
    try {
      const courseId = String(req.params.courseId || "").trim();
      const admin = getSupabaseAdmin();
      const { data: course } = await admin
        .from("courses")
        .select("id")
        .eq("id", courseId)
        .maybeSingle();
      if (!course) {
        notFound(res, "Course not found");
        return;
      }

      const { data, error } = await admin
        .from("course_schedule_rules")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const schedules = await Promise.all(
        (data ?? []).map((row) => serializeSchedule(row as ScheduleRuleRow))
      );
      res.json({ schedules });
    } catch (err) {
      console.error("[admin/schedules list]", err);
      res.status(500).json({ error: "Failed to list schedules" });
    }
  });

  /** GET /schedules/:id */
  router.get("/schedules/:id", async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("course_schedule_rules")
        .select("*")
        .eq("id", req.params.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        notFound(res, "Schedule not found");
        return;
      }
      res.json({ schedule: await serializeSchedule(data as ScheduleRuleRow) });
    } catch (err) {
      console.error("[admin/schedules get]", err);
      res.status(500).json({ error: "Failed to load schedule" });
    }
  });

  /** PATCH /schedules/:id */
  router.patch("/schedules/:id", async (req: AuthedRequest, res) => {
    try {
      const admin = getSupabaseAdmin();
      const body = (req.body || {}) as Record<string, unknown>;
      const regenerate =
        body.regenerate === true || body.regenerate === "true";

      const { data: existing, error: findErr } = await admin
        .from("course_schedule_rules")
        .select("*")
        .eq("id", req.params.id)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!existing) {
        notFound(res, "Schedule not found");
        return;
      }
      const before = existing as ScheduleRuleRow;

      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (body.title !== undefined) {
        const title = String(body.title).trim();
        if (!title) {
          badRequest(res, "title cannot be empty");
          return;
        }
        patch.title = title;
      }
      if (body.instructor_name !== undefined || body.instructor !== undefined) {
        patch.instructor_name = String(
          body.instructor_name ?? body.instructor ?? ""
        ).trim();
      }
      if (body.location !== undefined) {
        patch.location = String(body.location).trim();
      }
      if (body.description !== undefined) {
        patch.description = String(body.description).trim();
      }
      if (body.meeting_url !== undefined || body.meetingUrl !== undefined) {
        const raw = body.meeting_url ?? body.meetingUrl;
        const meetingUrl =
          raw == null || String(raw).trim() === ""
            ? null
            : String(raw).trim();
        if (meetingUrl && !isHttpUrl(meetingUrl)) {
          badRequest(res, "meeting_url must be a valid http(s) URL when provided");
          return;
        }
        patch.meeting_url = meetingUrl;
      }
      if (body.status !== undefined) {
        const status = String(body.status).trim();
        if (!["draft", "published", "cancelled"].includes(status)) {
          badRequest(res, "status must be draft, published, or cancelled");
          return;
        }
        // Publishing must go through POST …/publish (calendar + email)
        if (status === "published" && before.status !== "published") {
          badRequest(
            res,
            "Use POST /api/admin/schedules/:id/publish to publish a schedule"
          );
          return;
        }
        patch.status = status;
        if (status === "draft" && before.status === "published") {
          (patch as Record<string, unknown>).notify_email_sent_at = null;
        }
      }
      if (body.start_date !== undefined || body.startDate !== undefined) {
        patch.start_date = asYmd(body.start_date ?? body.startDate);
      }
      if (body.end_date !== undefined || body.endDate !== undefined) {
        patch.end_date = asYmd(body.end_date ?? body.endDate);
      }
      if (body.start_time !== undefined || body.startTime !== undefined) {
        patch.start_time = String(body.start_time ?? body.startTime).trim();
      }
      if (body.end_time !== undefined || body.endTime !== undefined) {
        patch.end_time = String(body.end_time ?? body.endTime).trim();
      }
      if (body.timezone !== undefined) {
        patch.timezone = String(body.timezone).trim();
      }
      if (body.days_of_week !== undefined || body.daysOfWeek !== undefined) {
        try {
          patch.days_of_week = normalizeDaysOfWeek(
            (body.days_of_week ?? body.daysOfWeek) as Array<number | string>
          );
        } catch (err) {
          badRequest(
            res,
            err instanceof ScheduleGeneratorError
              ? err.message
              : "Invalid days_of_week"
          );
          return;
        }
      }

      const merged: ScheduleRuleRow = {
        ...before,
        ...patch,
        start_date: asYmd(String(patch.start_date ?? before.start_date)),
        end_date: asYmd(String(patch.end_date ?? before.end_date)),
        start_time: asTime(String(patch.start_time ?? before.start_time)),
        end_time: asTime(String(patch.end_time ?? before.end_time)),
        days_of_week: (patch.days_of_week ??
          before.days_of_week) as number[],
        timezone: String(patch.timezone ?? before.timezone),
        title: String(patch.title ?? before.title),
      };

      try {
        assertValidScheduleInput(ruleToGenerateInput(merged));
      } catch (err) {
        badRequest(
          res,
          err instanceof ScheduleGeneratorError
            ? err.message
            : "Invalid schedule"
        );
        return;
      }

      // Normalize times in patch for storage
      if (patch.start_time !== undefined) {
        patch.start_time = asTime(String(patch.start_time));
      }
      if (patch.end_time !== undefined) {
        patch.end_time = asTime(String(patch.end_time));
      }
      if (patch.start_date !== undefined) {
        patch.start_date = asYmd(String(patch.start_date));
      }
      if (patch.end_date !== undefined) {
        patch.end_date = asYmd(String(patch.end_date));
      }

      const isStructural = structuralChanged(before, patch as Partial<ScheduleRuleRow>);

      // Published schedules: structural edits return the rule to draft for re-review + publish
      if (isStructural && before.status === "published") {
        patch.status = "draft";
        (patch as Record<string, unknown>).notify_email_sent_at = null;
      }

      const { data: updated, error } = await admin
        .from("course_schedule_rules")
        .update(patch)
        .eq("id", before.id)
        .select("*")
        .single();
      if (error) throw error;
      const rule = updated as ScheduleRuleRow;

      let futureSessionsCancelled = 0;
      let completedSessionsPreserved = 0;
      let futureMetadataUpdated = 0;
      let generated = null;
      let regenerateRequired = false;

      if (patch.status === "cancelled") {
        const result = await cancelFutureScheduledSessions(
          rule.id,
          await courseNameForId(rule.course_id)
        );
        futureSessionsCancelled = result.cancelled;
        completedSessionsPreserved = result.preserved;
      } else if (isStructural) {
        const result = await cancelFutureScheduledSessions(
          rule.id,
          await courseNameForId(rule.course_id)
        );
        futureSessionsCancelled = result.cancelled;
        completedSessionsPreserved = result.preserved;
        regenerateRequired = true;
        if (regenerate) {
          generated = await materializeScheduleSessions(
            ruleToGenerateInput(rule)
          );
          regenerateRequired = false;
        }
      } else {
        // Metadata-only: push title/instructor/etc. to future scheduled sessions
        futureMetadataUpdated = await applyMetadataToFutureSessions(rule);
        const counts = await getSessionCounts(rule.id);
        completedSessionsPreserved = counts.completed_session_count;
      }

      const { data: latest } = await admin
        .from("course_schedule_rules")
        .select("*")
        .eq("id", before.id)
        .single();

      res.json({
        schedule: await serializeSchedule((latest || rule) as ScheduleRuleRow),
        futureSessionsCancelled,
        completedSessionsPreserved,
        futureMetadataUpdated,
        regenerateRequired,
        generated: generated
          ? {
              sessions: generated.sessions,
              createdCount: generated.createdCount,
              skippedCount: generated.skippedCount,
              totalExpanded: generated.totalExpanded,
            }
          : null,
        note: isStructural
          ? before.status === "published"
            ? "Structural fields changed on a published schedule. Future sessions cancelled; schedule returned to draft. Regenerate sessions, then publish again."
            : regenerate
              ? "Structural fields changed; future scheduled sessions were cancelled and regenerated. Completed/past sessions were preserved."
              : "Structural fields changed; future scheduled sessions were cancelled. Call POST /api/admin/schedules/:id/generate, then publish."
          : patch.status === "cancelled"
            ? "Schedule cancelled; future scheduled sessions were cancelled. Historical sessions were preserved."
            : "Schedule metadata updated; future scheduled sessions received metadata updates. Completed/past sessions were not modified.",
      });
    } catch (err) {
      if (err instanceof ScheduleGeneratorError) {
        badRequest(res, err.message);
        return;
      }
      console.error("[admin/schedules patch]", err);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  /** DELETE /schedules/:id — soft-cancel rule + future sessions (no hard delete). */
  router.delete("/schedules/:id", async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      const { data: existing, error: findErr } = await admin
        .from("course_schedule_rules")
        .select("*")
        .eq("id", req.params.id)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!existing) {
        notFound(res, "Schedule not found");
        return;
      }

      const nowIso = new Date().toISOString();
      const { data: updated, error } = await admin
        .from("course_schedule_rules")
        .update({ status: "cancelled", updated_at: nowIso })
        .eq("id", req.params.id)
        .select("*")
        .single();
      if (error) throw error;

      const result = await cancelFutureScheduledSessions(
        req.params.id,
        await courseNameForId(existing.course_id)
      );

      res.json({
        ok: true,
        schedule: await serializeSchedule(updated as ScheduleRuleRow),
        futureSessionsCancelled: result.cancelled,
        historicalSessionsPreserved: result.preserved,
        note: "Schedule marked cancelled. Future scheduled sessions were cancelled; historical/completed sessions were preserved (no hard delete).",
      });
    } catch (err) {
      console.error("[admin/schedules delete]", err);
      res.status(500).json({ error: "Failed to cancel schedule" });
    }
  });

  /** POST /schedules/:id/generate — materialize draft sessions only (no notify). */
  router.post("/schedules/:id/generate", async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      const { data: rule, error } = await admin
        .from("course_schedule_rules")
        .select("*")
        .eq("id", req.params.id)
        .maybeSingle();
      if (error) throw error;
      if (!rule) {
        notFound(res, "Schedule not found");
        return;
      }
      if (rule.status === "cancelled") {
        badRequest(res, "Cannot generate sessions for a cancelled schedule");
        return;
      }

      const generated = await materializeScheduleSessions(
        ruleToGenerateInput(rule as ScheduleRuleRow)
      );

      // Ensure schedule stays draft until explicit publish
      if (rule.status !== "draft" && rule.status !== "published") {
        await admin
          .from("course_schedule_rules")
          .update({ status: "draft", updated_at: new Date().toISOString() })
          .eq("id", rule.id);
      }

      res.json({
        schedule: await serializeSchedule(rule as ScheduleRuleRow),
        generated: {
          sessions: generated.sessions,
          created: generated.created,
          createdCount: generated.createdCount,
          skippedCount: generated.skippedCount,
          totalExpanded: generated.totalExpanded,
        },
        note: "Sessions generated as draft. Publish to create calendar events and email students.",
      });
    } catch (err) {
      if (err instanceof ScheduleGeneratorError) {
        badRequest(res, err.message);
        return;
      }
      console.error("[admin/schedules generate]", err);
      res.status(500).json({ error: "Failed to generate sessions" });
    }
  });

  /** POST /schedules/:id/publish — calendar + email + notifications (idempotent). */
  router.post(
    "/schedules/:id/publish",
    rateLimit("schedule_publish"),
    async (req: AuthedRequest, res) => {
      try {
        const admin = getSupabaseAdmin();
        const { data: rule, error } = await admin
          .from("course_schedule_rules")
          .select("*")
          .eq("id", req.params.id)
          .maybeSingle();
        if (error) throw error;
        if (!rule) {
          notFound(res, "Schedule not found");
          return;
        }
        if (rule.status === "cancelled") {
          badRequest(res, "Cannot publish a cancelled schedule");
          return;
        }

        const counts = await getSessionCounts(rule.id);
        if (counts.session_count === 0) {
          badRequest(
            res,
            "No sessions to publish. Generate sessions first, then publish."
          );
          return;
        }

        const result = await publishScheduleRule({
          scheduleRuleId: rule.id,
          publishedBy: req.userId ?? null,
        });

        const { data: refreshed } = await admin
          .from("course_schedule_rules")
          .select("*")
          .eq("id", rule.id)
          .single();

        res.json({
          schedule: await serializeSchedule(
            (refreshed || rule) as ScheduleRuleRow
          ),
          publish: result,
          note: result.scheduleEmailAlreadySent
            ? "Schedule already published earlier — calendar synced; schedule email skipped (no duplicates)."
            : "Schedule published. Calendar events synced where possible; one schedule email sent per eligible student (batched).",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to publish";
        if (/cannot publish|not found|no sessions/i.test(msg)) {
          badRequest(res, msg);
          return;
        }
        console.error("[admin/schedules publish]", err);
        res.status(500).json({ error: "Failed to publish schedule" });
      }
    }
  );
}
