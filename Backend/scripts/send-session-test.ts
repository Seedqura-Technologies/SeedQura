import "dotenv/config";
import { sendMail, sessionScheduledEmail } from "../src/lib/mail.ts";
import { buildIcs } from "../src/lib/google-calendar.ts";

const to = process.argv[2] || "ansulsingh67890@gmail.com";
const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
const endsAt = new Date(
  Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000
).toISOString();

const mail = sessionScheduledEmail({
  name: "Ansul",
  courseName: "Crop Vision with PyTorch",
  sessionTitle: "Live Lab — Model Training Walkthrough",
  startsAt,
  endsAt,
  meetingUrl: "https://meet.google.com/seedqura-test",
  instructorName: "Seedqura Faculty",
  action: "created",
});

const ics = buildIcs({
  uid: `test-session-${Date.now()}`,
  title: "Crop Vision with PyTorch: Live Lab — Model Training Walkthrough",
  description: "Test session schedule email from Seedqura",
  startsAt,
  endsAt,
  meetingUrl: "https://meet.google.com/seedqura-test",
});

console.log("MAIL_FROM:", process.env.MAIL_FROM);
console.log("Sending to:", to);

const result = await sendMail({
  to,
  ...mail,
  attachments: [{ filename: "session.ics", content: ics }],
});

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
