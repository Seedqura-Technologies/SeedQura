/**
 * End-to-end course scheduling scenario (offline).
 *
 * Mocks Supabase / Resend / Google Calendar while exercising real lifecycle
 * functions: preview → generate (in-memory) → publish → edit → cancel → catch-up.
 *
 * Run: npm run test:e2e
 *
 * IMPORTANT: Do not statically import modules that transitively load supabase/
 * mail/google — mocks must register first.
 */
import assert from "node:assert/strict";
import { after, describe, it, mock } from "node:test";
import { pathToFileURL } from "node:url";
import path from "node:path";
import {
  createEmptyStore,
  createFakeSupabaseAdmin,
  type FakeStore,
  type Row,
} from "./__test__/fake-supabase.js";
import {
  ScheduleGeneratorError,
  assertValidScheduleInput,
  buildSchedulePreview,
  expandScheduleOccurrences,
  selectNewOccurrences,
  type ScheduleGenerateInput,
} from "./schedule-generator.js";
import { buildSessionIcs } from "./ics.js";

const COURSE_ID = "ai-ml-foundation";
const RULE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TIMEZONE = "Asia/Kolkata";

type MailMsg = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: unknown[];
};

type CalendarOp = {
  op: "upsert" | "delete";
  input?: Record<string, unknown>;
  googleEventId?: string | null;
};

const sentMails: MailMsg[] = [];
const calendarOps: CalendarOp[] = [];
let calendarMode: "google" | "ics" | "fail" = "google";
let mailMode: "ok" | "fail" = "ok";
let eventSeq = 0;

const store: FakeStore = createEmptyStore();

function libUrl(file: string) {
  return pathToFileURL(path.join(process.cwd(), "src", "lib", file)).href;
}

function scheduleInput(
  overrides: Partial<ScheduleGenerateInput> = {}
): ScheduleGenerateInput {
  return {
    courseId: COURSE_ID,
    scheduleRuleId: RULE_ID,
    startDate: "2026-09-05",
    endDate: "2026-09-27",
    daysOfWeek: ["Saturday", "Sunday"],
    startTime: "10:00",
    endTime: "13:00",
    timezone: TIMEZONE,
    title: "AI/ML Foundation",
    instructor: "Dr. Rao",
    meetingUrl: "https://meet.example.com/aiml",
    location: "Online",
    description: "1-month foundation lab",
    ...overrides,
  };
}

function seedEligibleStudents(storeRef: FakeStore) {
  for (let i = 1; i <= 5; i++) {
    const id = `student-${i}`;
    storeRef.profiles.push({
      id,
      full_name: `Student ${i}`,
      email: `student${i}@example.com`,
      status: "active",
      role: "student",
    });
    storeRef.enrollments.push({
      id: `enr-${i}`,
      user_id: id,
      course_id: COURSE_ID,
      status: "active",
      payment_status: "paid",
    });
  }
}

function seedIneligibleStudents(storeRef: FakeStore) {
  storeRef.profiles.push(
    {
      id: "suspended-1",
      full_name: "Suspended Sam",
      email: "suspended@example.com",
      status: "suspended",
      role: "student",
    },
    {
      id: "bademail-1",
      full_name: "Bad Email",
      email: "not-an-email",
      status: "active",
      role: "student",
    },
    {
      id: "refunded-1",
      full_name: "Refunded Riley",
      email: "refunded@example.com",
      status: "active",
      role: "student",
    },
    {
      id: "cancelled-1",
      full_name: "Cancelled Casey",
      email: "cancelled@example.com",
      status: "active",
      role: "student",
    }
  );
  storeRef.enrollments.push(
    {
      id: "enr-suspended",
      user_id: "suspended-1",
      course_id: COURSE_ID,
      status: "active",
      payment_status: "paid",
    },
    {
      id: "enr-bademail",
      user_id: "bademail-1",
      course_id: COURSE_ID,
      status: "active",
      payment_status: "paid",
    },
    {
      id: "enr-refunded",
      user_id: "refunded-1",
      course_id: COURSE_ID,
      status: "refunded",
      payment_status: "refunded",
    },
    {
      id: "enr-cancelled",
      user_id: "cancelled-1",
      course_id: COURSE_ID,
      status: "rejected",
      payment_status: "paid",
    }
  );
}

function materializeIntoStore(storeRef: FakeStore, input: ScheduleGenerateInput) {
  const occurrences = expandScheduleOccurrences(input);
  const existingStarts = storeRef.course_sessions
    .filter((s) => s.schedule_rule_id === input.scheduleRuleId)
    .map((s) => String(s.starts_at));
  const toInsert = selectNewOccurrences(occurrences, existingStarts);
  const created: Row[] = [];
  for (const occ of toInsert) {
    const row = {
      id: crypto.randomUUID(),
      ...occ,
      google_event_id: null,
      notify_sent_at: null,
      calendar_invite_via: null,
      ics_invite_sent_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storeRef.course_sessions.push(row);
    created.push(row);
  }
  return {
    totalExpanded: occurrences.length,
    createdCount: created.length,
    skippedCount: occurrences.length - created.length,
    created,
    sessions: storeRef.course_sessions.filter(
      (s) => s.schedule_rule_id === input.scheduleRuleId
    ),
  };
}

function resetScenario() {
  for (const key of Object.keys(store) as (keyof FakeStore)[]) {
    store[key].length = 0;
  }
  sentMails.length = 0;
  calendarOps.length = 0;
  calendarMode = "google";
  mailMode = "ok";
  eventSeq = 0;

  store.courses.push({
    id: COURSE_ID,
    name: "AI/ML Foundation",
    duration: "1 month",
  });
  store.course_schedule_rules.push({
    id: RULE_ID,
    course_id: COURSE_ID,
    start_date: "2026-09-05",
    end_date: "2026-09-27",
    days_of_week: [0, 6],
    start_time: "10:00:00",
    end_time: "13:00:00",
    timezone: TIMEZONE,
    title: "AI/ML Foundation",
    instructor_name: "Dr. Rao",
    meeting_url: "https://meet.example.com/aiml",
    location: "Online",
    description: "1-month foundation lab",
    status: "draft",
    published_at: null,
    published_by: null,
    notify_email_sent_at: null,
    created_by: "admin-1",
  });
  seedEligibleStudents(store);
  seedIneligibleStudents(store);
}

const realMail = await import(libUrl("mail.js"));
const realGoogle = await import(libUrl("google-calendar.js"));

mock.module(libUrl("supabase.js"), {
  namedExports: {
    getSupabaseAdmin: () => createFakeSupabaseAdmin(store),
  },
});

mock.module(libUrl("mail.js"), {
  namedExports: {
    ...realMail,
    sendMail: async (opts: MailMsg) => {
      if (mailMode === "fail") {
        return { ok: false, error: { message: "Resend unavailable" } };
      }
      sentMails.push(opts);
      return { ok: true, id: `mail-${sentMails.length}` };
    },
    sendMailInBatches: async (messages: MailMsg[]) => {
      if (mailMode === "fail") {
        return { sent: 0, skipped: 0, failed: messages.length };
      }
      for (const msg of messages) sentMails.push(msg);
      return { sent: messages.length, skipped: 0, failed: 0 };
    },
  },
});

mock.module(libUrl("google-calendar.js"), {
  namedExports: {
    ...realGoogle,
    isGoogleCalendarConfigured: () => calendarMode !== "ics",
    upsertCalendarEvent: async (input: Record<string, unknown>) => {
      calendarOps.push({ op: "upsert", input });
      if (calendarMode === "fail") {
        return {
          ok: false,
          eventId: null,
          syncStatus: "failed",
          configured: true,
          invitedViaGoogle: false,
          inviteChannel: "none",
          attendeeCount:
            (input.attendeeEmails as string[] | undefined)?.length ?? 0,
          error: "Google Calendar API unavailable",
        };
      }
      if (calendarMode === "ics") {
        return {
          ok: false,
          eventId: null,
          syncStatus: "pending",
          configured: false,
          invitedViaGoogle: false,
          inviteChannel: "ics_email",
          attendeeCount:
            (input.attendeeEmails as string[] | undefined)?.length ?? 0,
        };
      }
      eventSeq += 1;
      const eventId =
        (input.googleEventId as string | null | undefined) ||
        `gcal-evt-${eventSeq}`;
      return {
        ok: true,
        eventId,
        syncStatus: "synced",
        configured: true,
        invitedViaGoogle: true,
        inviteChannel: "google",
        attendeeCount:
          (input.attendeeEmails as string[] | undefined)?.length ?? 0,
        recreated: false,
      };
    },
    deleteCalendarEvent: async (googleEventId: string | null | undefined) => {
      calendarOps.push({ op: "delete", googleEventId: googleEventId ?? null });
      return {
        ok: true,
        eventId: googleEventId ?? null,
        syncStatus: "cancelled",
        configured: true,
      };
    },
  },
});

const { publishScheduleRule } = await import(libUrl("schedule-publish.js"));
const { updateSessionSafely, validateSessionEdit } = await import(
  libUrl("session-edit.js")
);
const { cancelSessionSafely, validateSessionCancellation } = await import(
  libUrl("session-cancel.js")
);
const {
  syncStudentCourseCalendar,
  selectSessionsToInvite,
} = await import(libUrl("student-course-calendar.js"));
const { getActiveCourseStudents, selectActiveCourseStudents } = await import(
  libUrl("course-students.js")
);
const { deliverSessionCalendarInvites } = await import(libUrl("sessions.js"));

describe("E2E: AI/ML Foundation scheduling lifecycle", () => {
  after(() => {
    mock.restoreAll();
  });

  it("1–5: create → preview → generate → review draft sessions", () => {
    resetScenario();
    const input = scheduleInput();

    const preview = buildSchedulePreview(input);
    assert.equal(preview.total_sessions, 8);
    assert.equal(preview.timezone, TIMEZONE);
    assert.ok(preview.sessions.every((s) => s.label.includes("10:00")));
    assert.ok(preview.sessions.every((s) => s.label.includes("13:00")));

    const first = materializeIntoStore(store, input);
    assert.equal(first.createdCount, 8);
    assert.equal(first.skippedCount, 0);
    assert.equal(store.course_sessions.length, 8);
    assert.ok(store.course_sessions.every((s) => s.status === "scheduled"));
    assert.ok(store.course_sessions.every((s) => !s.notify_sent_at));

    const second = materializeIntoStore(store, input);
    assert.equal(second.createdCount, 0);
    assert.equal(second.skippedCount, 8);
    assert.equal(store.course_sessions.length, 8);

    assert.equal(store.course_schedule_rules[0].status, "draft");
  });

  it("6–11: publish notifies 5 eligible students, syncs Google, records invites", async () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    calendarMode = "google";
    mailMode = "ok";

    const eligible = await getActiveCourseStudents(COURSE_ID);
    assert.equal(eligible.length, 5, "only 5 active eligible students");
    assert.ok(eligible.every((s) => s.email.includes("@example.com")));
    assert.ok(!eligible.some((s) => s.email.startsWith("suspended")));
    assert.ok(!eligible.some((s) => s.email.startsWith("refunded")));

    const result = await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });

    assert.equal(result.sessionsTotal, 8);
    assert.equal(result.emailsSent, 5);
    assert.equal(result.emailsFailed, 0);
    assert.equal(result.notificationsCreated, 5);
    assert.equal(result.scheduleEmailAlreadySent, false);
    assert.equal(result.calendarCreated, 8);
    assert.equal(result.calendarFailed, 0);
    assert.equal(result.calendarGoogleInvites, 8);
    assert.equal(result.calendarInviteSummary, "google");

    const rule = store.course_schedule_rules[0];
    assert.equal(rule.status, "published");
    assert.ok(rule.notify_email_sent_at);
    assert.ok(rule.published_at);

    const scheduleEmails = sentMails.filter((m) =>
      m.subject.toLowerCase().includes("schedule")
    );
    assert.equal(scheduleEmails.length, 5);
    const recipients = new Set(scheduleEmails.map((m) => m.to));
    assert.equal(recipients.size, 5);
    assert.ok(!recipients.has("suspended@example.com"));
    assert.ok(!recipients.has("refunded@example.com"));
    assert.ok(!recipients.has("cancelled@example.com"));

    const publishedNotes = store.notifications.filter(
      (n) => n.type === "schedule_published"
    );
    assert.equal(publishedNotes.length, 5);
    for (const n of publishedNotes) {
      const meta = n.metadata as Record<string, unknown>;
      assert.equal(meta.courseId, COURSE_ID);
      assert.equal(meta.courseName, "AI/ML Foundation");
      assert.equal(meta.scheduleRuleId, RULE_ID);
    }

    const upserts = calendarOps.filter((c) => c.op === "upsert");
    assert.equal(upserts.length, 8);
    for (const op of upserts) {
      const attendees = op.input?.attendeeEmails as string[];
      assert.equal(attendees.length, 5);
    }

    assert.ok(
      store.course_sessions.every((s) => s.calendar_sync_status === "synced")
    );
    assert.ok(store.course_sessions.every((s) => s.google_event_id));
    assert.ok(store.course_sessions.every((s) => s.notify_sent_at));
    assert.equal(store.course_session_student_invites.length, 8 * 5);

    const sample = store.course_sessions[0];
    const ics = buildSessionIcs({
      sessionId: String(sample.id),
      courseName: "AI/ML Foundation",
      sessionTitle: String(sample.title),
      startsAt: String(sample.starts_at),
      endsAt: String(sample.ends_at),
      timezone: TIMEZONE,
      meetingUrl: String(sample.meeting_url),
      location: String(sample.location),
      attendeeEmails: eligible.map((s) => s.email),
    });
    assert.ok(ics.includes("BEGIN:VCALENDAR"));
    assert.ok(ics.includes("BEGIN:VEVENT"));
  });

  it("11b: .ics fallback path when Google cannot invite", async () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    calendarMode = "ics";
    mailMode = "ok";
    sentMails.length = 0;

    const one = store.course_sessions[0];
    const result = await deliverSessionCalendarInvites({
      session: one as never,
      courseName: "AI/ML Foundation",
      timezone: TIMEZONE,
      action: "upsert",
    });

    assert.equal(result.calendarInviteVia, "ics_email");
    assert.ok(result.icsEmailsSent >= 5);
    const icsMails = sentMails.filter(
      (m) => (m.attachments?.length ?? 0) > 0
    );
    assert.ok(icsMails.length >= 5);
    assert.ok(
      store.course_session_student_invites.some(
        (i) => i.session_id === one.id && i.invite_channel === "ics_email"
      )
    );
  });

  it("12: student sees only future published sessions", () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    store.course_schedule_rules[0].status = "published";

    const midCourseMs = Date.parse("2026-09-14T00:00:00.000Z");
    const sessions = store.course_sessions.map((s) => ({
      ...s,
      schedule_rule: store.course_schedule_rules[0],
    }));

    const visible = sessions.filter((s) => {
      if (s.status !== "scheduled") return false;
      if (Date.parse(String(s.starts_at)) <= midCourseMs) return false;
      const rule = s.schedule_rule as { status?: string };
      return rule?.status === "published";
    });
    assert.ok(visible.length > 0);
    assert.ok(visible.length < 8);
    assert.ok(
      visible.every((s) => Date.parse(String(s.starts_at)) > midCourseMs)
    );
  });

  it("13–15: admin edits session → calendar upsert + student update email/notification", async () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    calendarMode = "google";
    await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });
    sentMails.length = 0;
    calendarOps.length = 0;
    const beforeNotes = store.notifications.length;

    const target = store.course_sessions[2];
    const result = await updateSessionSafely({
      sessionId: String(target.id),
      body: {
        title: "AI/ML Foundation — Lab focus",
        confirmPublishedEdit: true,
      },
    });

    assert.equal(result.studentsNotified, true);
    assert.ok(result.notified >= 5);
    assert.ok(calendarOps.some((c) => c.op === "upsert"));
    assert.equal(
      store.course_sessions.find((s) => s.id === target.id)?.title,
      "AI/ML Foundation — Lab focus"
    );

    const updateEmails = sentMails.filter((m) =>
      /updated|scheduled|class/i.test(m.subject)
    );
    assert.ok(updateEmails.length >= 5);
    assert.ok(store.notifications.length > beforeNotes);
    assert.ok(store.notifications.some((n) => n.type === "session_updated"));
  });

  it("16–18: admin cancels session → calendar delete + cancellation notice", async () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    calendarMode = "google";
    await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });
    sentMails.length = 0;
    calendarOps.length = 0;

    const target = store.course_sessions[3];
    const result = await cancelSessionSafely({
      sessionId: String(target.id),
      cancellationReason: "Instructor unavailable",
      replacementPlanned: "yes",
      confirmPublishedCancel: true,
    });

    assert.equal(result.studentsNotified, true);
    assert.ok(result.notified >= 5);
    assert.ok(calendarOps.some((c) => c.op === "delete"));
    assert.equal(
      store.course_sessions.find((s) => s.id === target.id)?.status,
      "cancelled"
    );
    assert.equal(store.course_schedule_rules[0].status, "published");

    const cancelEmails = sentMails.filter((m) => /cancel/i.test(m.subject));
    assert.ok(cancelEmails.length >= 5);
    assert.ok(store.notifications.some((n) => n.type === "session_cancelled"));
  });

  it("19–21: mid-course enroll gets only future sessions; no duplicate invites for existing", async () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    calendarMode = "google";
    await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });

    const invitesBefore = store.course_session_student_invites.length;
    const mailsBefore = sentMails.length;

    const mid = Date.parse("2026-09-14T00:00:00.000Z");
    store.course_sessions = store.course_sessions.filter(
      (s) => Date.parse(String(s.starts_at)) > mid
    );
    // Keep invite rows only for remaining sessions
    const remainingIds = new Set(store.course_sessions.map((s) => s.id));
    store.course_session_student_invites =
      store.course_session_student_invites.filter((i) =>
        remainingIds.has(i.session_id)
      );

    const futureCount = store.course_sessions.length;
    assert.ok(futureCount > 0 && futureCount < 8);

    const existingCatchup = await syncStudentCourseCalendar(
      "student-1",
      COURSE_ID
    );
    assert.equal(existingCatchup.sessionsInvited, 0);
    assert.equal(existingCatchup.scheduleEmailsSent, 0);
    assert.equal(
      store.course_session_student_invites.filter((i) => i.user_id === "student-1")
        .length,
      futureCount,
      "existing students must not get duplicate invitations"
    );
    assert.equal(sentMails.length, mailsBefore);

    store.profiles.push({
      id: "student-6",
      full_name: "Student 6",
      email: "student6@example.com",
      status: "active",
      role: "student",
    });
    store.enrollments.push({
      id: "enr-6",
      user_id: "student-6",
      course_id: COURSE_ID,
      status: "active",
      payment_status: "paid",
    });

    const catchup = await syncStudentCourseCalendar("student-6", COURSE_ID);
    assert.equal(catchup.ok, true);
    assert.equal(catchup.sessionsInvited, futureCount);
    assert.equal(catchup.sessionsSkipped, 0);
    assert.equal(catchup.scheduleEmailsSent, 1);

    const newInvites = store.course_session_student_invites.filter(
      (i) => i.user_id === "student-6"
    );
    assert.equal(newInvites.length, futureCount);

    const again = await syncStudentCourseCalendar("student-6", COURSE_ID);
    assert.equal(again.sessionsInvited, 0);
    assert.equal(again.scheduleEmailsSent, 0);

    // Existing invite count unchanged for student-1
    assert.equal(
      store.course_session_student_invites.filter((i) => i.user_id === "student-1")
        .length,
      futureCount
    );
    void invitesBefore;
  });

  it("duplicate publish: schedule emails are not resent", async () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    calendarMode = "google";
    const first = await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });
    assert.equal(first.scheduleEmailAlreadySent, false);
    assert.equal(first.emailsSent, 5);

    sentMails.length = 0;
    const second = await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });
    assert.equal(second.scheduleEmailAlreadySent, true);
    assert.equal(second.emailsSent, 0);
    assert.equal(second.emailsSkipped, 5);
    assert.equal(
      sentMails.filter((m) => m.subject.toLowerCase().includes("schedule"))
        .length,
      0
    );
  });
});

describe("E2E failure cases", () => {
  it("rejects invalid dates / end before start / no days / invalid time", () => {
    assert.throws(
      () => assertValidScheduleInput(scheduleInput({ startDate: "09-05-2026" })),
      ScheduleGeneratorError
    );
    assert.throws(
      () =>
        assertValidScheduleInput(
          scheduleInput({ startDate: "2026-09-27", endDate: "2026-09-05" })
        ),
      ScheduleGeneratorError
    );
    assert.throws(
      () => assertValidScheduleInput(scheduleInput({ daysOfWeek: [] })),
      ScheduleGeneratorError
    );
    assert.throws(
      () =>
        assertValidScheduleInput(
          scheduleInput({ startTime: "10:00", endTime: "09:00" })
        ),
      ScheduleGeneratorError
    );
    assert.throws(
      () => assertValidScheduleInput(scheduleInput({ startTime: "10" })),
      ScheduleGeneratorError
    );
  });

  it("excludes suspended, refunded, cancelled, and invalid-email students", () => {
    const eligible = selectActiveCourseStudents([
      {
        id: "1",
        user_id: "a",
        status: "active",
        payment_status: "paid",
        profile: {
          id: "a",
          full_name: "A",
          email: "a@example.com",
          status: "active",
        },
      },
      {
        id: "2",
        user_id: "b",
        status: "active",
        payment_status: "paid",
        profile: {
          id: "b",
          full_name: "B",
          email: "b@example.com",
          status: "suspended",
        },
      },
      {
        id: "3",
        user_id: "c",
        status: "refunded",
        payment_status: "refunded",
        profile: {
          id: "c",
          full_name: "C",
          email: "c@example.com",
          status: "active",
        },
      },
      {
        id: "4",
        user_id: "d",
        status: "rejected",
        payment_status: "paid",
        profile: {
          id: "d",
          full_name: "D",
          email: "d@example.com",
          status: "active",
        },
      },
      {
        id: "5",
        user_id: "e",
        status: "active",
        payment_status: "paid",
        profile: {
          id: "e",
          full_name: "E",
          email: "invalid",
          status: "active",
        },
      },
    ]);
    assert.deepEqual(
      eligible.map((s) => s.userId),
      ["a"]
    );
  });

  it("calendar API failure marks sessions failed and notifies students", async () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    calendarMode = "fail";
    mailMode = "ok";

    const result = await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });

    assert.equal(result.calendarFailed, 8);
    assert.equal(result.calendarCreated, 0);
    assert.ok(
      store.course_sessions.every((s) => s.calendar_sync_status === "failed")
    );
    assert.ok(
      store.notifications.some((n) => n.type === "calendar_sync_failed")
    );
    assert.equal(result.emailsSent, 5);
  });

  it("email API failure is reported without throwing publish", async () => {
    resetScenario();
    materializeIntoStore(store, scheduleInput());
    calendarMode = "google";
    mailMode = "fail";

    const result = await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });

    assert.equal(result.emailsFailed, 5);
    assert.equal(result.emailsSent, 0);
    assert.equal(store.course_schedule_rules[0].status, "published");
    assert.equal(
      store.course_schedule_rules[0].notify_email_sent_at,
      null,
      "failed email must not block retry publish"
    );

    // Retry after Resend recovers
    mailMode = "ok";
    sentMails.length = 0;
    const retry = await publishScheduleRule({
      scheduleRuleId: RULE_ID,
      publishedBy: "admin-1",
    });
    assert.equal(retry.scheduleEmailAlreadySent, false);
    assert.equal(retry.emailsSent, 5);
    assert.ok(store.course_schedule_rules[0].notify_email_sent_at);
  });

  it("publish with no sessions fails", async () => {
    resetScenario();
    await assert.rejects(
      () =>
        publishScheduleRule({
          scheduleRuleId: RULE_ID,
          publishedBy: "admin-1",
        }),
      /No sessions to publish/
    );
  });

  it("edit/cancel of published sessions require confirmation", () => {
    const session = {
      id: "s1",
      course_id: COURSE_ID,
      title: "Lab",
      description: "",
      instructor_name: "Dr. Rao",
      starts_at: "2026-09-20T04:30:00.000Z",
      ends_at: "2026-09-20T07:30:00.000Z",
      meeting_url: "https://meet.example.com/aiml",
      location: "",
      status: "scheduled",
      google_event_id: "evt-1",
      notify_sent_at: "2026-09-01T00:00:00.000Z",
      schedule_rule_id: RULE_ID,
    };

    assert.throws(
      () =>
        validateSessionEdit(session, { title: "Changed" }, {
          scheduleRuleStatus: "published",
        }),
      /confirmPublishedEdit/
    );
    assert.throws(
      () =>
        validateSessionCancellation(session, {
          scheduleRuleStatus: "published",
          confirmPublishedCancel: false,
        }),
      /confirmPublishedCancel/
    );
  });

  it("catch-up never invites past sessions", () => {
    const nowMs = Date.parse("2026-09-14T00:00:00.000Z");
    const sessions = [
      {
        id: "past",
        status: "scheduled",
        starts_at: "2026-09-06T04:30:00.000Z",
        schedule_rule_id: RULE_ID,
        schedule_rule: { status: "published" },
      },
      {
        id: "future",
        status: "scheduled",
        starts_at: "2026-09-20T04:30:00.000Z",
        schedule_rule_id: RULE_ID,
        schedule_rule: { status: "published" },
      },
    ];

    const toInvite = selectSessionsToInvite(sessions as never, new Set(), nowMs);
    assert.deepEqual(
      toInvite.map((s) => s.id),
      ["future"]
    );
  });
});
