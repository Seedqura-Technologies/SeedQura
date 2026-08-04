import { Resend } from "resend";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  const raw = process.env.MAIL_FROM || "Seedqura <onboarding@resend.dev>";
  // Allow bare email in .env
  if (raw.includes("<") || raw.includes(" ")) return raw;
  return `Seedqura <${raw}>`;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
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

export function welcomeEmail(opts: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}) {
  const name = escapeHtml(opts.name || "there");
  const email = escapeHtml(opts.email);
  const password = escapeHtml(opts.password);
  const loginUrl = escapeHtml(opts.loginUrl);
  return {
    subject: "Welcome to Seedqura — your login details",
    html: `<p>Hi ${name},</p>
<p>Welcome to Seedqura. Your account has been created successfully.</p>
<p><strong>Your login credentials</strong></p>
<ul>
  <li>Email: <strong>${email}</strong></li>
  <li>Password: <strong>${password}</strong></li>
</ul>
<p><a href="${loginUrl}">Log in to your dashboard</a></p>
<p>Keep this email safe. You can change your password after signing in if needed.</p>
<p>— The Seedqura team</p>`,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function paymentSuccessEmail(name: string, courseName: string, amountDisplay: string) {
  return {
    subject: `Payment confirmed — ${courseName}`,
    html: `<p>Hi ${name || "there"},</p>
<p>We received your payment of <strong>${amountDisplay}</strong> for <strong>${courseName}</strong>.</p>
<p>The course is now in your Purchased Products on the dashboard.</p>
<p>— The Seedqura team</p>`,
  };
}

export function paymentFailedEmail(name: string, courseName: string) {
  return {
    subject: `Payment failed — ${courseName}`,
    html: `<p>Hi ${name || "there"},</p>
<p>Your payment for <strong>${courseName}</strong> did not go through. You can try again from the Products page.</p>
<p>— The Seedqura team</p>`,
  };
}

export function enrollmentConfirmationEmail(name: string, courseName: string) {
  return {
    subject: `You're enrolled — ${courseName}`,
    html: `<p>Hi ${name || "there"},</p>
<p>You're enrolled in <strong>${courseName}</strong>. Open your dashboard to track progress and updates.</p>
<p>— The Seedqura team</p>`,
  };
}

export function enrollmentDecisionEmail(
  name: string,
  courseName: string,
  decision: "approved" | "rejected"
) {
  const approved = decision === "approved";
  return {
    subject: approved
      ? `Enrollment approved — ${courseName}`
      : `Enrollment update — ${courseName}`,
    html: `<p>Hi ${name || "there"},</p>
<p>Your enrollment for <strong>${courseName}</strong> was <strong>${decision}</strong>.</p>
<p>— The Seedqura team</p>`,
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
}) {
  const when = `${formatWhen(opts.startsAt)} – ${formatWhen(opts.endsAt)}`;
  const actionLabel =
    opts.action === "created"
      ? "scheduled"
      : opts.action === "updated"
        ? "updated"
        : "cancelled";
  return {
    subject: `Class ${actionLabel}: ${opts.sessionTitle} (${opts.courseName})`,
    html: `<p>Hi ${escapeHtml(opts.name || "there")},</p>
<p>A class session for <strong>${escapeHtml(opts.courseName)}</strong> was <strong>${actionLabel}</strong>.</p>
<ul>
  <li><strong>Session:</strong> ${escapeHtml(opts.sessionTitle)}</li>
  <li><strong>When:</strong> ${escapeHtml(when)}</li>
  ${opts.instructorName ? `<li><strong>Instructor:</strong> ${escapeHtml(opts.instructorName)}</li>` : ""}
  ${opts.meetingUrl && opts.action !== "cancelled" ? `<li><strong>Join:</strong> <a href="${escapeHtml(opts.meetingUrl)}">${escapeHtml(opts.meetingUrl)}</a></li>` : ""}
</ul>
<p>An calendar invite (.ics) is attached so you can add it to Google Calendar or Outlook.</p>
<p>— The Seedqura team</p>`,
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
