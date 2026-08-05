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
        <p style="margin:0;font-size:13px;color:#7a726a;">A calendar invite (.ics) is attached so you can add it to Google Calendar or Outlook.</p>
      `,
      cta:
        opts.meetingUrl && opts.action !== "cancelled"
          ? { label: "Join session", href: opts.meetingUrl }
          : { label: "Open dashboard", href: dashboard },
    }),
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
