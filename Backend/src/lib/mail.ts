import { Resend } from "resend";

let _resend: Resend | null | undefined;

function client() {
  if (_resend !== undefined) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    _resend = null;
    return null;
  }
  _resend = new Resend(key);
  return _resend;
}

function fromAddress() {
  const raw = process.env.MAIL_FROM || "Seedqura <onboarding@resend.dev>";
  if (raw.includes("<") || raw.includes(" ")) return raw;
  return `Seedqura <${raw}>`;
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    "https://www.seedqura.com"
  ).replace(/\/$/, "");
}

function logoUrl() {
  // Prefer compressed mark when deployed; fall back to full logo asset.
  return `${siteUrl()}/logo.png`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared Seedqura branded email shell (table layout for client compatibility). */
function emailLayout(opts: {
  preheader?: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}) {
  const base = siteUrl();
  const logo = logoUrl();
  const preheader = escapeHtml(opts.preheader || opts.title);
  const eyebrow = opts.eyebrow ? escapeHtml(opts.eyebrow) : "";
  const title = escapeHtml(opts.title);
  const year = new Date().getFullYear();

  const ctaBlock = opts.cta
    ? `
      <tr>
        <td style="padding:8px 40px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" bgcolor="#1a7a55" style="border-radius:10px;">
                <a href="${escapeHtml(opts.cta.href)}"
                   style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                  ${escapeHtml(opts.cta.label)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const secondaryBlock = opts.secondaryCta
    ? `
      <tr>
        <td style="padding:4px 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;">
          <a href="${escapeHtml(opts.secondaryCta.href)}" style="color:#1a7a55;text-decoration:underline;">
            ${escapeHtml(opts.secondaryCta.label)}
          </a>
        </td>
      </tr>`
    : `<tr><td style="padding-bottom:24px;"></td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f2ef;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f2ef;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e2db;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2e24 0%,#1a7a55 100%);padding:28px 40px;text-align:left;">
              <img src="${escapeHtml(logo)}" alt="Seedqura" width="140" height="auto"
                   style="display:block;width:140px;max-width:50%;height:auto;border:0;" />
            </td>
          </tr>
          <!-- Accent bar -->
          <tr>
            <td style="height:4px;background-color:#5faf8f;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 8px;font-family:Arial,Helvetica,sans-serif;color:#1c1714;">
              ${
                eyebrow
                  ? `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1a7a55;">${eyebrow}</p>`
                  : ""
              }
              <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;font-weight:700;color:#1c1714;">${title}</h1>
              <div style="font-size:15px;line-height:1.65;color:#4a433c;">
                ${opts.bodyHtml}
              </div>
            </td>
          </tr>
          ${ctaBlock}
          ${secondaryBlock}
          <!-- Footer -->
          <tr>
            <td style="background-color:#faf8f5;border-top:1px solid #ebe5de;padding:24px 40px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1c1714;">Seedqura</p>
              <p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:#7a726a;">
                Intelligent Agriculture × Precision Medicine
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#7a726a;">
                <a href="${escapeHtml(base)}" style="color:#1a7a55;text-decoration:none;">Website</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(base)}/dashboard" style="color:#1a7a55;text-decoration:none;">Dashboard</a>
                &nbsp;·&nbsp;
                <a href="mailto:hello@seedqura.com" style="color:#1a7a55;text-decoration:none;">hello@seedqura.com</a>
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:#a39b93;">
                © ${year} Seedqura. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRows(rows: { label: string; value: string }[]) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:20px 0;border:1px solid #ebe5de;border-radius:12px;overflow:hidden;">
      ${rows
        .map(
          (r, i) => `
        <tr>
          <td style="padding:12px 16px;background-color:${i % 2 === 0 ? "#faf8f5" : "#ffffff"};font-size:13px;color:#7a726a;width:38%;vertical-align:top;">
            ${escapeHtml(r.label)}
          </td>
          <td style="padding:12px 16px;background-color:${i % 2 === 0 ? "#faf8f5" : "#ffffff"};font-size:14px;font-weight:600;color:#1c1714;vertical-align:top;">
            ${r.value}
          </td>
        </tr>`
        )
        .join("")}
    </table>`;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback for clients that prefer or only support text. */
  text?: string;
  attachments?: { filename: string; content: Buffer | string }[];
}) {
  const resend = client();
  if (!resend) {
    console.log("[mail] RESEND_API_KEY unset — logging email", {
      to: opts.to,
      subject: opts.subject,
    });
    return { ok: true, skipped: true as const };
  }
  const result = await resend.emails.send({
    from: fromAddress(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.text ? { text: opts.text } : {}),
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content:
        typeof a.content === "string"
          ? Buffer.from(a.content).toString("base64")
          : a.content.toString("base64"),
    })),
  });
  if (result.error) {
    console.error("[mail] send failed", result.error);
    return { ok: false, error: result.error };
  }
  return { ok: true, id: result.data?.id };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send many emails with bounded concurrency to avoid Resend rate limits.
 * Processes `batchSize` in parallel, then waits `delayMs` before the next batch.
 */
export async function sendMailInBatches(
  messages: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: { filename: string; content: Buffer | string }[];
  }>,
  opts?: { batchSize?: number; delayMs?: number }
): Promise<{ sent: number; failed: number; skipped: number }> {
  const batchSize = Math.max(1, opts?.batchSize ?? 10);
  const delayMs = Math.max(0, opts?.delayMs ?? 250);
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((m) => sendMail(m)));
    for (const r of results) {
      if (r.ok && "skipped" in r && r.skipped) skipped += 1;
      else if (r.ok) sent += 1;
      else failed += 1;
    }
    if (i + batchSize < messages.length && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return { sent, failed, skipped };
}

export function welcomeEmail(opts: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}) {
  const name = escapeHtml(opts.name || "there");
  const email = escapeHtml(opts.email);
  const password = escapeHtml(opts.password);
  const loginUrl = opts.loginUrl;

  return {
    subject: "Welcome to Seedqura — your login details",
    html: emailLayout({
      preheader: "Your Seedqura account is ready. Log in to get started.",
      eyebrow: "Account created",
      title: `Welcome, ${name}`,
      bodyHtml: `
        <p style="margin:0 0 14px;">Your Seedqura account has been created successfully. Use the credentials below to access your dashboard.</p>
        ${detailRows([
          { label: "Email", value: email },
          {
            label: "Password",
            value: `<span style="font-family:Consolas,Monaco,monospace;letter-spacing:0.02em;">${password}</span>`,
          },
        ])}
        <p style="margin:0;font-size:13px;color:#7a726a;">Keep this email safe. You can change your password after signing in.</p>
      `,
      cta: { label: "Open dashboard", href: loginUrl },
      secondaryCta: { label: "Go to Seedqura home", href: siteUrl() },
    }),
  };
}

export function paymentSuccessEmail(
  name: string,
  courseName: string,
  amountDisplay: string
) {
  const safeName = escapeHtml(name || "there");
  const safeCourse = escapeHtml(courseName);
  const safeAmount = escapeHtml(amountDisplay);
  const dashboard = `${siteUrl()}/dashboard`;

  return {
    subject: `Payment confirmed — ${courseName}`,
    html: emailLayout({
      preheader: `Payment of ${amountDisplay} for ${courseName} received.`,
      eyebrow: "Payment successful",
      title: "Thank you for your payment",
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">We’ve successfully received your payment. Your course access is being activated.</p>
        ${detailRows([
          { label: "Course", value: safeCourse },
          { label: "Amount paid", value: safeAmount },
          { label: "Status", value: "Paid" },
        ])}
        <p style="margin:0;">You’ll also receive an enrollment confirmation. Find this course under <strong>Purchased Products</strong> in your dashboard.</p>
      `,
      cta: { label: "View purchased courses", href: dashboard },
    }),
  };
}

export function paymentFailedEmail(name: string, courseName: string) {
  const safeName = escapeHtml(name || "there");
  const safeCourse = escapeHtml(courseName);
  const products = `${siteUrl()}/products`;

  return {
    subject: `Payment failed — ${courseName}`,
    html: emailLayout({
      preheader: `Payment for ${courseName} did not go through. You can try again.`,
      eyebrow: "Payment unsuccessful",
      title: "We couldn’t complete your payment",
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">Your payment for <strong>${safeCourse}</strong> did not go through. No amount has been charged for a failed attempt.</p>
        <p style="margin:0;">You can retry enrollment from the Products page whenever you’re ready.</p>
      `,
      cta: { label: "Try again", href: products },
      secondaryCta: {
        label: "Contact support",
        href: "mailto:hello@seedqura.com",
      },
    }),
  };
}

export function enrollmentConfirmationEmail(name: string, courseName: string) {
  const safeName = escapeHtml(name || "there");
  const safeCourse = escapeHtml(courseName);
  const dashboard = `${siteUrl()}/dashboard`;

  return {
    subject: `You're enrolled — ${courseName}`,
    html: emailLayout({
      preheader: `You're enrolled in ${courseName}. Open your dashboard to get started.`,
      eyebrow: "Enrollment confirmed",
      title: `You're in — ${safeCourse}`,
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">Welcome aboard. Your enrollment in <strong>${safeCourse}</strong> is confirmed.</p>
        ${detailRows([
          { label: "Program", value: safeCourse },
          { label: "Access", value: "Active on your dashboard" },
        ])}
        <p style="margin:0;">Track sessions, updates, and progress from your student dashboard.</p>
      `,
      cta: { label: "Go to dashboard", href: dashboard },
    }),
  };
}

export function enrollmentDecisionEmail(
  name: string,
  courseName: string,
  decision: "approved" | "rejected"
) {
  const approved = decision === "approved";
  const safeName = escapeHtml(name || "there");
  const safeCourse = escapeHtml(courseName);
  const dashboard = `${siteUrl()}/dashboard`;
  const products = `${siteUrl()}/products`;

  return {
    subject: approved
      ? `Enrollment approved — ${courseName}`
      : `Enrollment update — ${courseName}`,
    html: emailLayout({
      preheader: approved
        ? `Your enrollment in ${courseName} was approved.`
        : `Update on your enrollment for ${courseName}.`,
      eyebrow: approved ? "Approved" : "Enrollment update",
      title: approved
        ? "Your enrollment is approved"
        : "Enrollment status update",
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">Your enrollment for <strong>${safeCourse}</strong> was <strong>${approved ? "approved" : "not approved"}</strong>.</p>
        ${
          approved
            ? `<p style="margin:0;">You can now access the course from your dashboard.</p>`
            : `<p style="margin:0;">If you have questions, reply to this email or contact <a href="mailto:hello@seedqura.com" style="color:#1a7a55;">hello@seedqura.com</a>.</p>`
        }
      `,
      cta: approved
        ? { label: "Open dashboard", href: dashboard }
        : { label: "Browse courses", href: products },
    }),
  };
}

export function fellowshipSelectionEmail(opts: {
  name: string;
  payUrl: string;
}) {
  const safeName = escapeHtml(opts.name || "there");
  const payUrl = escapeHtml(opts.payUrl);

  return {
    subject: "Research Fellowship — you're selected · complete your fee",
    html: emailLayout({
      preheader:
        "Congratulations — complete your Research Fellowship fee within 72 hours.",
      eyebrow: "Research Fellowship",
      title: "You're selected",
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">Congratulations — you&apos;ve been selected for the <strong>Seedqura Research Fellowship</strong> (3 months · live weekends).</p>
        <p style="margin:0 0 14px;">Complete your program fee of <strong>₹19,999 incl. GST</strong> within <strong>72 hours</strong>. Sign in with <strong>this email address</strong> before paying.</p>
        <p style="margin:0;">After we verify your UTR, your fellowship access unlocks on your dashboard.</p>
      `,
      cta: { label: "Complete your fee", href: payUrl },
      secondaryCta: {
        label: "Program details",
        href: `${siteUrl()}/academy/research-fellowship`,
      },
    }),
  };
}

export function sessionScheduledEmail(opts: {
  name: string;
  courseName: string;
  sessionTitle: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string | null;
  instructorName?: string;
  action: "created" | "updated" | "cancelled";
  /** How the student received/will receive a calendar invite. */
  calendarInviteVia?: "google" | "ics_email" | "none";
}) {
  const actionLabel =
    opts.action === "created"
      ? "scheduled"
      : opts.action === "updated"
        ? "updated"
        : "cancelled";
  const when = `${formatWhen(opts.startsAt)} – ${formatWhen(opts.endsAt)}`;
  const safeName = escapeHtml(opts.name || "there");
  const rows: { label: string; value: string }[] = [
    { label: "Session", value: escapeHtml(opts.sessionTitle) },
    { label: "Course", value: escapeHtml(opts.courseName) },
    { label: "When", value: escapeHtml(when) },
  ];
  if (opts.instructorName) {
    rows.push({
      label: "Instructor",
      value: escapeHtml(opts.instructorName),
    });
  }
  if (opts.meetingUrl && opts.action !== "cancelled") {
    rows.push({
      label: "Join link",
      value: `<a href="${escapeHtml(opts.meetingUrl)}" style="color:#1a7a55;word-break:break-all;">${escapeHtml(opts.meetingUrl)}</a>`,
    });
  }

  const dashboard = `${siteUrl()}/dashboard`;
  const calendarNote =
    opts.action === "cancelled"
      ? ""
      : opts.calendarInviteVia === "google"
        ? `<p style="margin:0;font-size:13px;color:#7a726a;">A Google Calendar invitation was sent to your email. Accept it to add this class to your calendar.</p>`
        : opts.calendarInviteVia === "ics_email"
          ? `<p style="margin:0;font-size:13px;color:#7a726a;">A calendar invite (.ics) is attached — open it to add this class to Google Calendar, Outlook, or Apple Calendar.</p>`
          : `<p style="margin:0;font-size:13px;color:#7a726a;">Open your dashboard for session details.</p>`;

  return {
    subject: `Class ${actionLabel}: ${opts.sessionTitle} (${opts.courseName})`,
    html: emailLayout({
      preheader: `Class ${actionLabel}: ${opts.sessionTitle} — ${when}`,
      eyebrow: `Class ${actionLabel}`,
      title: escapeHtml(opts.sessionTitle),
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">A class session for <strong>${escapeHtml(opts.courseName)}</strong> was <strong>${actionLabel}</strong>.</p>
        ${detailRows(rows)}
        ${calendarNote}
      `,
      cta:
        opts.meetingUrl && opts.action !== "cancelled"
          ? { label: "Join session", href: opts.meetingUrl }
          : { label: "Open dashboard", href: dashboard },
    }),
  };
}

export type ReplacementPlanned = "yes" | "no" | "unknown";

function formatSessionDate(iso: string, timezone?: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: timezone || process.env.SESSION_TIMEZONE || "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function formatSessionTime(iso: string, timezone?: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      timeZone: timezone || process.env.SESSION_TIMEZONE || "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function replacementPlannedCopy(plan: ReplacementPlanned): {
  html: string;
  text: string;
} {
  switch (plan) {
    case "yes":
      return {
        html: `<p style="margin:0 0 14px;"><strong>Replacement class:</strong> Yes — a replacement session will be scheduled. We will notify you when details are confirmed.</p>`,
        text: "Replacement class: Yes — a replacement session will be scheduled. We will notify you when details are confirmed.",
      };
    case "no":
      return {
        html: `<p style="margin:0 0 14px;"><strong>Replacement class:</strong> No — there is no replacement planned for this cancelled session.</p>`,
        text: "Replacement class: No — there is no replacement planned for this cancelled session.",
      };
    default:
      return {
        html: `<p style="margin:0 0 14px;"><strong>Replacement class:</strong> To be confirmed — we will let you know if a replacement session is scheduled.</p>`,
        text: "Replacement class: To be confirmed — we will let you know if a replacement session is scheduled.",
      };
  }
}

/** Dedicated cancellation email when an admin cancels a published class session. */
export function sessionCancelledEmail(opts: {
  name: string;
  courseName: string;
  sessionTitle: string;
  startsAt: string;
  endsAt: string;
  instructorName?: string;
  cancellationReason?: string | null;
  replacementPlanned?: ReplacementPlanned;
  timezone?: string;
}) {
  const tz = opts.timezone || process.env.SESSION_TIMEZONE || "Asia/Kolkata";
  const classDate = formatSessionDate(opts.startsAt, tz);
  const startTime = formatSessionTime(opts.startsAt, tz);
  const endTime = formatSessionTime(opts.endsAt, tz);
  const originalTime = `${startTime} – ${endTime}`;
  const safeName = escapeHtml(opts.name || "there");
  const replacement = replacementPlannedCopy(opts.replacementPlanned || "unknown");
  const dashboard = `${siteUrl()}/dashboard`;

  const rows: { label: string; value: string }[] = [
    { label: "Course", value: escapeHtml(opts.courseName) },
    { label: "Cancelled class", value: escapeHtml(opts.sessionTitle) },
    { label: "Class date", value: escapeHtml(classDate) },
    { label: "Original time", value: escapeHtml(originalTime) },
  ];
  if (opts.instructorName?.trim()) {
    rows.push({
      label: "Instructor",
      value: escapeHtml(opts.instructorName.trim()),
    });
  }
  if (opts.cancellationReason?.trim()) {
    rows.push({
      label: "Reason",
      value: escapeHtml(opts.cancellationReason.trim()),
    });
  }

  const textLines = [
    `Hi ${opts.name || "there"},`,
    "",
    `A class session for ${opts.courseName} has been cancelled.`,
    "",
    `Course: ${opts.courseName}`,
    `Cancelled class: ${opts.sessionTitle}`,
    `Class date: ${classDate}`,
    `Original time: ${originalTime}`,
    opts.instructorName?.trim()
      ? `Instructor: ${opts.instructorName.trim()}`
      : null,
    opts.cancellationReason?.trim()
      ? `Reason: ${opts.cancellationReason.trim()}`
      : null,
    "",
    replacement.text,
    "",
    "Other upcoming sessions in this course are not affected.",
    `Dashboard: ${dashboard}`,
    "",
    "— Seedqura",
  ].filter((line) => line !== null);

  return {
    subject: `Class cancelled: ${opts.sessionTitle} (${opts.courseName})`,
    html: emailLayout({
      preheader: `${opts.sessionTitle} on ${classDate} has been cancelled.`,
      eyebrow: "Class cancelled",
      title: escapeHtml(opts.sessionTitle),
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">A class session for <strong>${escapeHtml(opts.courseName)}</strong> has been <strong>cancelled</strong>. The rest of your course schedule is unchanged.</p>
        ${detailRows(rows)}
        ${replacement.html}
        <p style="margin:0;font-size:13px;color:#7a726a;">Open your dashboard to view remaining upcoming sessions.</p>
      `,
      cta: { label: "Open dashboard", href: dashboard },
    }),
    text: textLines.join("\n"),
  };
}

export type RescheduleMode = "in_place" | "replacement_created";

/** Dedicated reschedule email when a class session moves to a new date/time. */
export function sessionRescheduledEmail(opts: {
  name: string;
  courseName: string;
  sessionTitle: string;
  previousStartsAt: string;
  previousEndsAt: string;
  newStartsAt: string;
  newEndsAt: string;
  instructorName?: string;
  timezone?: string;
  mode?: RescheduleMode;
  note?: string | null;
}) {
  const tz = opts.timezone || process.env.SESSION_TIMEZONE || "Asia/Kolkata";
  const prevDate = formatSessionDate(opts.previousStartsAt, tz);
  const prevTime = `${formatSessionTime(opts.previousStartsAt, tz)} – ${formatSessionTime(opts.previousEndsAt, tz)}`;
  const newDate = formatSessionDate(opts.newStartsAt, tz);
  const newTime = `${formatSessionTime(opts.newStartsAt, tz)} – ${formatSessionTime(opts.newEndsAt, tz)}`;
  const safeName = escapeHtml(opts.name || "there");
  const dashboard = `${siteUrl()}/dashboard`;

  const rows: { label: string; value: string }[] = [
    { label: "Course", value: escapeHtml(opts.courseName) },
    { label: "Class", value: escapeHtml(opts.sessionTitle) },
    { label: "Previous date", value: escapeHtml(prevDate) },
    { label: "Previous time", value: escapeHtml(prevTime) },
    { label: "New date", value: escapeHtml(newDate) },
    { label: "New time", value: escapeHtml(newTime) },
  ];
  if (opts.instructorName?.trim()) {
    rows.push({
      label: "Instructor",
      value: escapeHtml(opts.instructorName.trim()),
    });
  }
  if (opts.note?.trim()) {
    rows.push({ label: "Note", value: escapeHtml(opts.note.trim()) });
  }

  const modeNote =
    opts.mode === "replacement_created"
      ? `<p style="margin:0 0 14px;font-size:13px;color:#7a726a;">This class was moved to a new session slot. Your calendar invite reflects the <strong>new</strong> date and time.</p>`
      : `<p style="margin:0 0 14px;font-size:13px;color:#7a726a;">This is the same class session — your calendar invite has been updated to the new date and time.</p>`;

  const textLines = [
    `Hi ${opts.name || "there"},`,
    "",
    `Your class for ${opts.courseName} has been rescheduled.`,
    "",
    `Class: ${opts.sessionTitle}`,
    `Previous: ${prevDate}, ${prevTime}`,
    `New: ${newDate}, ${newTime}`,
    opts.instructorName?.trim() ? `Instructor: ${opts.instructorName.trim()}` : null,
    opts.note?.trim() ? `Note: ${opts.note.trim()}` : null,
    "",
    "Please update your calendar with the new date and time.",
    `Dashboard: ${dashboard}`,
    "",
    "— Seedqura",
  ].filter((line) => line !== null);

  return {
    subject: `Class rescheduled: ${opts.sessionTitle} (${opts.courseName})`,
    html: emailLayout({
      preheader: `${opts.sessionTitle} moved to ${newDate}, ${newTime}`,
      eyebrow: "Class rescheduled",
      title: escapeHtml(opts.sessionTitle),
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">Your class for <strong>${escapeHtml(opts.courseName)}</strong> has been <strong>rescheduled</strong>.</p>
        ${detailRows(rows)}
        ${modeNote}
        <p style="margin:0;font-size:13px;color:#7a726a;">Other upcoming sessions in this course are unchanged.</p>
      `,
      cta: { label: "Open dashboard", href: dashboard },
    }),
    text: textLines.join("\n"),
  };
}

/** Dedicated ICS calendar invite email (fallback when Google cannot invite attendees). */
export function sessionCalendarInviteEmail(opts: {
  name: string;
  courseName: string;
  sessionTitle: string;
  startsAt: string;
  endsAt: string;
}) {
  const when = `${formatWhen(opts.startsAt)} – ${formatWhen(opts.endsAt)}`;
  const safeName = escapeHtml(opts.name || "there");
  const dashboard = `${siteUrl()}/dashboard`;

  return {
    subject: `Calendar invite: ${opts.sessionTitle} (${opts.courseName})`,
    html: emailLayout({
      preheader: `Add ${opts.sessionTitle} to your calendar — ${when}`,
      eyebrow: "Calendar invite",
      title: escapeHtml(opts.sessionTitle),
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">Your class <strong>${escapeHtml(opts.sessionTitle)}</strong> for <strong>${escapeHtml(opts.courseName)}</strong> is scheduled.</p>
        ${detailRows([
          { label: "When", value: escapeHtml(when) },
          { label: "Course", value: escapeHtml(opts.courseName) },
        ])}
        <p style="margin:0;font-size:13px;color:#7a726a;">Open the attached <strong>.ics</strong> file to add this session to your calendar app. (Google Calendar invitations are not available with the current server configuration.)</p>
      `,
      cta: { label: "Open dashboard", href: dashboard },
    }),
    text: [
      `Hi ${opts.name || "there"},`,
      "",
      `Calendar invite: ${opts.sessionTitle} (${opts.courseName})`,
      `When: ${when}`,
      "",
      "Open the attached .ics file to add this session to your calendar.",
      `Dashboard: ${dashboard}`,
    ].join("\n"),
  };
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: process.env.SESSION_TIMEZONE || "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatDateInZone(iso: string, timezone: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: timezone || "Asia/Kolkata",
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function formatClock(time: string) {
  const t = time.trim();
  if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5);
  return t;
}

export type SchedulePublishedEmailOpts = {
  name: string;
  courseName: string;
  scheduleTitle: string;
  courseDuration: string;
  classDays: string;
  classTime: string;
  timezone: string;
  instructor: string;
  meetingUrl?: string | null;
  location?: string | null;
  sessionCount: number;
  firstClassDate: string;
  lastClassDate: string;
  /** Honest summary of how per-session calendar invites are delivered. */
  calendarInviteSummary?: "google" | "ics_email" | "mixed" | "none";
  /** Student joined after publish — only upcoming sessions are included. */
  joinedLate?: boolean;
};

function scheduleCalendarInviteCopy(
  summary: SchedulePublishedEmailOpts["calendarInviteSummary"]
): { html: string; text: string } {
  switch (summary) {
    case "google":
      return {
        html: `<p style="margin:0 0 14px;">Each class session has a Google Calendar invitation sent to your email. Accept the invites to add all sessions to your calendar.</p>`,
        text: "Each class session has a Google Calendar invitation sent to your email.",
      };
    case "ics_email":
      return {
        html: `<p style="margin:0 0 14px;">Google Calendar attendee invitations are <strong>not</strong> available with the current server configuration. You will receive a separate email per class with an <strong>.ics</strong> attachment to add sessions to your calendar app.</p>`,
        text: "Google Calendar attendee invitations are not available with the current server configuration. You will receive separate .ics calendar attachments per class via email.",
      };
    case "mixed":
      return {
        html: `<p style="margin:0 0 14px;">Some sessions use Google Calendar invitations; others use <strong>.ics</strong> email attachments depending on server configuration.</p>`,
        text: "Some sessions use Google Calendar invitations; others use .ics email attachments.",
      };
    default:
      return {
        html: `<p style="margin:0 0 14px;">Review upcoming sessions in your dashboard for dates and join links.</p>`,
        text: "Review upcoming sessions in your dashboard.",
      };
  }
}

/** One email per student when a recurring schedule is published. */
export function schedulePublishedEmail(opts: SchedulePublishedEmailOpts) {
  const safeName = escapeHtml(opts.name || "there");
  const safeCourse = escapeHtml(opts.courseName);
  const safeTitle = escapeHtml(opts.scheduleTitle);
  const dashboard = `${siteUrl()}/dashboard`;

  const rows: { label: string; value: string }[] = [
    { label: "Course", value: safeCourse },
    { label: "Schedule", value: safeTitle },
  ];
  if (opts.courseDuration?.trim()) {
    rows.push({
      label: "Course duration",
      value: escapeHtml(opts.courseDuration.trim()),
    });
  }
  rows.push(
    { label: "Class days", value: escapeHtml(opts.classDays) },
    { label: "Class time", value: escapeHtml(opts.classTime) },
    { label: "Timezone", value: escapeHtml(opts.timezone) }
  );
  if (opts.instructor?.trim()) {
    rows.push({
      label: "Instructor",
      value: escapeHtml(opts.instructor.trim()),
    });
  }
  if (opts.meetingUrl?.trim()) {
    rows.push({
      label: "Meeting URL",
      value: `<a href="${escapeHtml(opts.meetingUrl.trim())}" style="color:#1a7a55;word-break:break-all;">${escapeHtml(opts.meetingUrl.trim())}</a>`,
    });
  }
  if (opts.location?.trim()) {
    rows.push({
      label: "Location",
      value: escapeHtml(opts.location.trim()),
    });
  }
  rows.push(
    {
      label: "Sessions",
      value: escapeHtml(String(opts.sessionCount)),
    },
    {
      label: "First class",
      value: escapeHtml(opts.firstClassDate),
    },
    {
      label: "Last class",
      value: escapeHtml(opts.lastClassDate),
    }
  );

  const inviteCopy = scheduleCalendarInviteCopy(opts.calendarInviteSummary);
  const lateJoinNote = opts.joinedLate
    ? `<p style="margin:0 0 14px;font-size:13px;color:#7a726a;">You joined after this schedule was published. <strong>Past sessions are not included</strong> — only your upcoming classes are listed below, and calendar invites are sent for those sessions only.</p>`
    : "";

  const textLines = [
    `Hi ${opts.name || "there"},`,
    "",
    opts.joinedLate
      ? `You enrolled in ${opts.courseName} after the schedule was published. Past sessions are not included — here are your upcoming classes:`
      : `The class schedule for ${opts.courseName} has been published.`,
    "",
    `Course: ${opts.courseName}`,
    `Schedule: ${opts.scheduleTitle}`,
    opts.courseDuration?.trim()
      ? `Course duration: ${opts.courseDuration.trim()}`
      : null,
    `Class days: ${opts.classDays}`,
    `Class time: ${opts.classTime}`,
    `Timezone: ${opts.timezone}`,
    opts.instructor?.trim() ? `Instructor: ${opts.instructor.trim()}` : null,
    opts.meetingUrl?.trim() ? `Meeting URL: ${opts.meetingUrl.trim()}` : null,
    opts.location?.trim() ? `Location: ${opts.location.trim()}` : null,
    `Number of sessions: ${opts.sessionCount}`,
    `First class: ${opts.firstClassDate}`,
    `Last class: ${opts.lastClassDate}`,
    "",
    inviteCopy.text,
    "",
    `Dashboard: ${dashboard}`,
    "",
    "— Seedqura",
  ].filter((line) => line !== null);

  return {
    subject: opts.joinedLate
      ? `Your upcoming schedule — ${opts.scheduleTitle} (${opts.courseName})`
      : `Schedule published — ${opts.scheduleTitle} (${opts.courseName})`,
    html: emailLayout({
      preheader: opts.joinedLate
        ? `Your upcoming classes for ${opts.courseName}.`
        : `${opts.scheduleTitle} for ${opts.courseName} is live.`,
      eyebrow: opts.joinedLate ? "Upcoming schedule" : "Schedule published",
      title: safeTitle,
      bodyHtml: `
        <p style="margin:0 0 14px;">Hi ${safeName},</p>
        <p style="margin:0 0 14px;">${
          opts.joinedLate
            ? `You're enrolled in <strong>${safeCourse}</strong>. Here are your <strong>upcoming</strong> class sessions:`
            : `The class schedule for <strong>${safeCourse}</strong> has been published. Here are the details:`
        }</p>
        ${lateJoinNote}
        ${detailRows(rows)}
        ${inviteCopy.html}
        <p style="margin:0;font-size:13px;color:#7a726a;">Open your dashboard anytime to review upcoming sessions and join links.</p>
      `,
      cta: opts.meetingUrl?.trim()
        ? { label: "Open meeting link", href: opts.meetingUrl.trim() }
        : { label: "Open dashboard", href: dashboard },
      secondaryCta: { label: "Student dashboard", href: dashboard },
    }),
    text: textLines.join("\n"),
  };
}

/** @internal helpers exported for tests / publish pipeline */
export const scheduleEmailFormat = {
  formatDateInZone,
  formatClock,
};
