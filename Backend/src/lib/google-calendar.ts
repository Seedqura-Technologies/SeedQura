import { google } from "googleapis";
import { DateTime } from "luxon";
import {
  buildCalendarEventDescription,
  sessionEventSummary,
} from "./calendar-format.js";

/** Persisted on course_sessions.calendar_sync_status */
export type CalendarSyncStatus = "pending" | "synced" | "failed" | "cancelled";

/** How students received (or will receive) a calendar invite for this session. */
export type CalendarInviteChannel = "google" | "ics_email" | "none";

export type CalendarSessionInput = {
  courseName: string;
  sessionTitle: string;
  sessionDetails?: string;
  instructorName?: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  meetingUrl?: string | null;
  location?: string | null;
  attendeeEmails: string[];
  googleEventId?: string | null;
};

export type CalendarUpsertResult = {
  ok: boolean;
  eventId?: string | null;
  syncStatus: CalendarSyncStatus;
  configured: boolean;
  /** True only when Google sent attendee invitations (sendUpdates=all with attendees). */
  invitedViaGoogle: boolean;
  inviteChannel: CalendarInviteChannel;
  attendeeCount: number;
  error?: string;
  /** True when a stale google_event_id was missing in Google and a new event was inserted. */
  recreated?: boolean;
};

export type CalendarLogLevel = "info" | "warn" | "error";

export type CalendarSyncLogPayload = {
  level: CalendarLogLevel;
  operation: "upsert" | "delete" | "retry";
  sessionId?: string;
  googleEventId?: string | null;
  syncStatus?: CalendarSyncStatus;
  attendeeCount?: number;
  recreated?: boolean;
  error?: string;
  message?: string;
};

/** Structured JSON logs — credentials are never included. */
export function logCalendarSync(payload: CalendarSyncLogPayload): void {
  const entry = {
    component: "google-calendar",
    ts: new Date().toISOString(),
    ...payload,
    error: payload.error
      ? sanitizeCalendarLogMessage(payload.error)
      : undefined,
  };
  const line = JSON.stringify(entry);
  if (payload.level === "error") {
    console.error(line);
  } else if (payload.level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export function isCalendarEventNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: number }).code;
  if (code === 404) return true;
  const status = (err as { response?: { status?: number } }).response?.status;
  if (status === 404) return true;
  const message =
    err instanceof Error ? err.message : String((err as { message?: string }).message ?? err);
  return /not found|404|resource has been deleted|entity was not found/i.test(message);
}

/**
 * Google Calendar integration (backend-only service account).
 *
 * **Authentication:** `google.auth.JWT` with `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`.
 * Optional `GOOGLE_CALENDAR_IMPERSONATE_USER` enables Domain-Wide Delegation so the
 * service account acts as a Workspace user who can email calendar invites to attendees
 * (including external student Gmail addresses).
 *
 * **Limitation (default service-account setup):** A plain service account on a shared
 * calendar cannot add external attendees or trigger Google invitation emails. Google
 * returns a delegation/forbidden error. In that case we create the organizer event
 * without attendees and deliver `.ics` files via Resend instead.
 *
 * Credentials are never exposed to students or the frontend.
 */
export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID
  );
}

/** Whether Domain-Wide Delegation impersonation is configured. */
export function isGoogleCalendarDelegationConfigured(): boolean {
  return Boolean(
    isGoogleCalendarConfigured() &&
      process.env.GOOGLE_CALENDAR_IMPERSONATE_USER?.trim()
  );
}

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const subject = process.env.GOOGLE_CALENDAR_IMPERSONATE_USER?.trim();
  if (!clientEmail || !privateKey) return null;
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    ...(subject ? { subject } : {}),
  });
}

export function sanitizeCalendarLogMessage(message: string): string {
  return message
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, "[REDACTED_KEY]")
    .replace(/"private_key"\s*:\s*"[^"]+"/gi, '"private_key":"[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, "Bearer [REDACTED]");
}

export {
  sessionEventSummary,
  buildCalendarEventDescription,
} from "./calendar-format.js";

export function formatCalendarDateTime(isoUtc: string, timezone: string) {
  const zone = timezone?.trim() || process.env.SESSION_TIMEZONE || "Asia/Kolkata";
  const dt = DateTime.fromISO(isoUtc, { zone: "utc" }).setZone(zone);
  return {
    dateTime: dt.toFormat("yyyy-MM-dd'T'HH:mm:ss"),
    timeZone: zone,
  };
}

export function buildCalendarEventBody(input: CalendarSessionInput) {
  const summary = sessionEventSummary(input.courseName, input.sessionTitle);
  const description = buildCalendarEventDescription({
    courseName: input.courseName,
    instructorName: input.instructorName,
    meetingUrl: input.meetingUrl,
    location: input.location,
    sessionDetails: input.sessionDetails,
  });

  const uniqueAttendees = [
    ...new Set(
      input.attendeeEmails.map((e) => e.trim().toLowerCase()).filter(Boolean)
    ),
  ];

  return {
    summary,
    description,
    location: input.location?.trim() || input.meetingUrl?.trim() || undefined,
    start: formatCalendarDateTime(input.startsAt, input.timezone),
    end: formatCalendarDateTime(input.endsAt, input.timezone),
    attendees: uniqueAttendees.map((email) => ({
      email,
      responseStatus: "needsAction" as const,
    })),
    guestsCanInviteOthers: false,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };
}

function isAttendeeDelegationError(message: string) {
  return /domain-wide delegation|cannot invite attendees|forbidden for service accounts|forbidden to access|invalid attendee email|cannot use sendUpdates/i.test(
    message
  );
}

/** Decide how students should receive invites after a Google sync attempt. */
export function resolveCalendarInviteChannel(opts: {
  configured: boolean;
  invitedViaGoogle: boolean;
  syncStatus: CalendarSyncStatus;
  attendeeCount: number;
}): CalendarInviteChannel {
  if (opts.attendeeCount === 0) return "none";
  if (opts.invitedViaGoogle && opts.syncStatus === "synced") return "google";
  // Google unavailable, failed, or cannot invite — use Resend + ICS
  return "ics_email";
}

async function writeEvent(opts: {
  calendar: ReturnType<typeof google.calendar>;
  calendarId: string;
  googleEventId?: string | null;
  body: ReturnType<typeof buildCalendarEventBody>;
  sendUpdates: "all" | "none";
}): Promise<{ eventId?: string; recreated?: boolean }> {
  if (opts.googleEventId) {
    try {
      const updated = await opts.calendar.events.patch({
        calendarId: opts.calendarId,
        eventId: opts.googleEventId,
        sendUpdates: opts.sendUpdates,
        requestBody: opts.body,
      });
      return { eventId: updated.data.id || opts.googleEventId };
    } catch (err) {
      if (isCalendarEventNotFoundError(err)) {
        logCalendarSync({
          level: "warn",
          operation: "upsert",
          googleEventId: opts.googleEventId,
          message:
            "Google event not found — creating a new event instead of duplicating",
          recreated: true,
        });
        const created = await opts.calendar.events.insert({
          calendarId: opts.calendarId,
          sendUpdates: opts.sendUpdates,
          requestBody: opts.body,
        });
        return {
          eventId: created.data.id || undefined,
          recreated: true,
        };
      }
      throw err;
    }
  }
  const created = await opts.calendar.events.insert({
    calendarId: opts.calendarId,
    sendUpdates: opts.sendUpdates,
    requestBody: opts.body,
  });
  return { eventId: created.data.id || undefined };
}

export async function upsertCalendarEvent(
  input: CalendarSessionInput
): Promise<CalendarUpsertResult> {
  const attendeeCount = [
    ...new Set(input.attendeeEmails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
  ].length;

  if (!isGoogleCalendarConfigured()) {
    return {
      ok: true,
      configured: false,
      syncStatus: "pending",
      eventId: input.googleEventId ?? null,
      invitedViaGoogle: false,
      inviteChannel: resolveCalendarInviteChannel({
        configured: false,
        invitedViaGoogle: false,
        syncStatus: "pending",
        attendeeCount,
      }),
      attendeeCount,
    };
  }

  const auth = getAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  if (!auth) {
    return {
      ok: true,
      configured: false,
      syncStatus: "pending",
      eventId: input.googleEventId ?? null,
      invitedViaGoogle: false,
      inviteChannel: resolveCalendarInviteChannel({
        configured: false,
        invitedViaGoogle: false,
        syncStatus: "pending",
        attendeeCount,
      }),
      attendeeCount,
    };
  }

  const calendar = google.calendar({ version: "v3", auth });
  const body = buildCalendarEventBody(input);

  // No attendees — still sync event shell; invites fall back to ICS
  if (attendeeCount === 0) {
    try {
      const bodyNoAttendees = { ...body, attendees: [] };
      const written = await writeEvent({
        calendar,
        calendarId,
        googleEventId: input.googleEventId,
        body: bodyNoAttendees,
        sendUpdates: "none",
      });
      logCalendarSync({
        level: "info",
        operation: "upsert",
        googleEventId: written.eventId ?? input.googleEventId,
        syncStatus: "synced",
        attendeeCount: 0,
        recreated: written.recreated,
      });
      return {
        ok: true,
        configured: true,
        eventId: written.eventId,
        syncStatus: "synced",
        invitedViaGoogle: false,
        inviteChannel: "none",
        attendeeCount: 0,
        recreated: written.recreated,
      };
    } catch (err) {
      const message = sanitizeCalendarLogMessage(
        err instanceof Error ? err.message : String(err)
      );
      logCalendarSync({
        level: "error",
        operation: "upsert",
        googleEventId: input.googleEventId,
        syncStatus: "failed",
        attendeeCount: 0,
        error: message,
      });
      return {
        ok: false,
        configured: true,
        syncStatus: "failed",
        eventId: input.googleEventId ?? null,
        invitedViaGoogle: false,
        inviteChannel: "none",
        attendeeCount: 0,
        error: message,
      };
    }
  }

  try {
    const written = await writeEvent({
      calendar,
      calendarId,
      googleEventId: input.googleEventId,
      body,
      sendUpdates: "all",
    });
    const invitedViaGoogle = true;
    const syncStatus: CalendarSyncStatus = "synced";
    logCalendarSync({
      level: "info",
      operation: "upsert",
      googleEventId: written.eventId ?? input.googleEventId,
      syncStatus,
      attendeeCount,
      recreated: written.recreated,
    });
    return {
      ok: true,
      configured: true,
      eventId: written.eventId,
      syncStatus,
      invitedViaGoogle,
      inviteChannel: resolveCalendarInviteChannel({
        configured: true,
        invitedViaGoogle,
        syncStatus,
        attendeeCount,
      }),
      attendeeCount,
      recreated: written.recreated,
    };
  } catch (err) {
    const message = sanitizeCalendarLogMessage(
      err instanceof Error ? err.message : String(err)
    );

    if (isAttendeeDelegationError(message)) {
      try {
        const bodyNoAttendees = { ...body, attendees: [] };
        const written = await writeEvent({
          calendar,
          calendarId,
          googleEventId: input.googleEventId,
          body: bodyNoAttendees,
          sendUpdates: "none",
        });
        logCalendarSync({
          level: "warn",
          operation: "upsert",
          googleEventId: written.eventId ?? input.googleEventId,
          syncStatus: "synced",
          attendeeCount,
          recreated: written.recreated,
          message:
            "Google attendee invitations unavailable — event saved without attendees; use ICS email fallback",
        });
        const syncStatus: CalendarSyncStatus = "synced";
        return {
          ok: true,
          configured: true,
          eventId: written.eventId,
          syncStatus,
          invitedViaGoogle: false,
          inviteChannel: resolveCalendarInviteChannel({
            configured: true,
            invitedViaGoogle: false,
            syncStatus,
            attendeeCount,
          }),
          attendeeCount,
          recreated: written.recreated,
        };
      } catch (fallbackErr) {
        const fallbackMessage = sanitizeCalendarLogMessage(
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        );
        logCalendarSync({
          level: "error",
          operation: "upsert",
          googleEventId: input.googleEventId,
          syncStatus: "failed",
          attendeeCount,
          error: fallbackMessage,
        });
        return {
          ok: false,
          configured: true,
          syncStatus: "failed",
          eventId: input.googleEventId ?? null,
          invitedViaGoogle: false,
          inviteChannel: resolveCalendarInviteChannel({
            configured: true,
            invitedViaGoogle: false,
            syncStatus: "failed",
            attendeeCount,
          }),
          attendeeCount,
          error: fallbackMessage,
        };
      }
    }

    logCalendarSync({
      level: "error",
      operation: "upsert",
      googleEventId: input.googleEventId,
      syncStatus: "failed",
      attendeeCount,
      error: message,
    });
    return {
      ok: false,
      configured: true,
      syncStatus: "failed",
      eventId: input.googleEventId ?? null,
      invitedViaGoogle: false,
      inviteChannel: resolveCalendarInviteChannel({
        configured: true,
        invitedViaGoogle: false,
        syncStatus: "failed",
        attendeeCount,
      }),
      attendeeCount,
      error: message,
    };
  }
}

export async function deleteCalendarEvent(
  googleEventId: string | null | undefined
): Promise<CalendarUpsertResult> {
  if (!googleEventId) {
    return {
      ok: true,
      configured: isGoogleCalendarConfigured(),
      syncStatus: "cancelled",
      eventId: null,
      invitedViaGoogle: false,
      inviteChannel: "none",
      attendeeCount: 0,
    };
  }

  if (!isGoogleCalendarConfigured()) {
    return {
      ok: true,
      configured: false,
      syncStatus: "cancelled",
      eventId: null,
      invitedViaGoogle: false,
      inviteChannel: "none",
      attendeeCount: 0,
    };
  }

  const auth = getAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  if (!auth) {
    return {
      ok: true,
      configured: false,
      syncStatus: "cancelled",
      eventId: null,
      invitedViaGoogle: false,
      inviteChannel: "none",
      attendeeCount: 0,
    };
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId,
      eventId: googleEventId,
      sendUpdates: "all",
    });
    logCalendarSync({
      level: "info",
      operation: "delete",
      googleEventId,
      syncStatus: "cancelled",
    });
    return {
      ok: true,
      configured: true,
      syncStatus: "cancelled",
      eventId: null,
      invitedViaGoogle: false,
      inviteChannel: "none",
      attendeeCount: 0,
    };
  } catch (err) {
    const message = sanitizeCalendarLogMessage(
      err instanceof Error ? err.message : String(err)
    );
    logCalendarSync({
      level: "error",
      operation: "delete",
      googleEventId,
      syncStatus: "failed",
      error: message,
    });
    return {
      ok: false,
      configured: true,
      syncStatus: "failed",
      eventId: googleEventId,
      invitedViaGoogle: false,
      inviteChannel: "none",
      attendeeCount: 0,
      error: message,
    };
  }
}

export {
  buildIcs,
  buildSessionIcs,
  buildSessionIcsAttachment,
  foldIcsLines,
  formatIcsLocalDateTime,
  formatIcsUtcStamp,
  buildVTimezone,
  type SessionIcsInput,
  type LegacyIcsInput,
} from "./ics.js";
