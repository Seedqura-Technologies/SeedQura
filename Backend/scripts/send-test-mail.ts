import "dotenv/config";
import {
  sendMail,
  welcomeEmail,
  paymentSuccessEmail,
  enrollmentConfirmationEmail,
  paymentFailedEmail,
  sessionScheduledEmail,
} from "../src/lib/mail.ts";

const to = process.argv[2] || "fariyad@ihubiitmandi.in";
const site =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.FRONTEND_URL ||
  "https://www.seedqura.com";

console.log("MAIL_FROM:", process.env.MAIL_FROM);
console.log("SITE_URL:", site);
console.log("Sending branded templates to:", to);

const welcome = welcomeEmail({
  name: "Fariyad",
  email: to,
  password: "••••••••",
  loginUrl: `${site.replace(/\/$/, "")}/login`,
});
console.log(
  "welcome:",
  JSON.stringify(await sendMail({ to, ...welcome }), null, 2)
);

const pay = paymentSuccessEmail("Fariyad", "Seedqura Academy", "₹24,999");
console.log("payment:", JSON.stringify(await sendMail({ to, ...pay }), null, 2));

const enroll = enrollmentConfirmationEmail("Fariyad", "Seedqura Academy");
console.log(
  "enrollment:",
  JSON.stringify(await sendMail({ to, ...enroll }), null, 2)
);

const failed = paymentFailedEmail("Fariyad", "Crop Vision with PyTorch");
console.log(
  "payment_failed:",
  JSON.stringify(await sendMail({ to, ...failed }), null, 2)
);

const starts = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
const ends = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString();
const session = sessionScheduledEmail({
  name: "Fariyad",
  courseName: "Seedqura Academy",
  sessionTitle: "Kickoff & Research Orientation",
  startsAt: starts,
  endsAt: ends,
  meetingUrl: "https://meet.google.com/example",
  instructorName: "Seedqura Faculty",
  action: "created",
});
console.log(
  "session:",
  JSON.stringify(await sendMail({ to, ...session }), null, 2)
);
