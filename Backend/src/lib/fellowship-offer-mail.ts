import { fellowshipSelectionEmail, sendMail } from "./mail.js";
import { markFellowshipSelectionEmailSent } from "./fellowship-selections.js";

export type FellowshipOfferEmailResult =
  | { status: "sent" }
  | { status: "skipped"; message: string }
  | { status: "failed"; message: string };

function fellowshipPayUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    "https://www.seedqura.com"
  ).replace(/\/$/, "");
  return `${base}/enroll/research-fellowship#pay`;
}

function formatMailError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Email send failed";
}

export async function sendFellowshipOfferEmail(opts: {
  email: string;
  name?: string | null;
}): Promise<FellowshipOfferEmailResult> {
  const mail = fellowshipSelectionEmail({
    name: opts.name?.trim() || opts.email,
    payUrl: fellowshipPayUrl(),
  });

  const sent = await sendMail({
    to: opts.email,
    subject: mail.subject,
    html: mail.html,
  });

  if ("skipped" in sent && sent.skipped) {
    return {
      status: "skipped",
      message:
        "RESEND_API_KEY is not set on the server. Add it in Render env vars.",
    };
  }

  if (!sent.ok) {
    return {
      status: "failed",
      message: formatMailError(sent.error),
    };
  }

  await markFellowshipSelectionEmailSent(opts.email);
  return { status: "sent" };
}
