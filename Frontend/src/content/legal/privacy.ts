import type { LegalDocument } from "@/lib/legal";

export const privacyPolicy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  description:
    "How Seedqura Technologies LLP collects, uses, stores, and protects your personal data under the Digital Personal Data Protection Act, 2023 (DPDP Act).",
  sections: [
    {
      id: "introduction",
      title: "1. Introduction",
      paragraphs: [
        "This Privacy Policy explains how Seedqura Technologies LLP (“Seedqura”, “we”, “us”, “our”), operating the Seedqura website, Academy, and related services, handles your personal data.",
        "We are committed to processing personal data lawfully, fairly, and transparently in accordance with the Digital Personal Data Protection Act, 2023 (“DPDP Act”) and applicable rules thereunder.",
        "By using our website, creating an account, submitting forms, enrolling in courses, or otherwise interacting with us, you acknowledge that you have read this Privacy Policy.",
      ],
    },
    {
      id: "data-fiduciary",
      title: "2. Data Fiduciary",
      paragraphs: [
        "For the purposes of the DPDP Act, Seedqura Technologies LLP is the Data Fiduciary responsible for determining the purpose and means of processing your personal data.",
        "Registered office: India.",
        "General contact: gethelp.seedqura@gmail.com",
        "Privacy and grievance contact: seedqura@gmail.com",
      ],
    },
    {
      id: "scope",
      title: "3. Scope",
      paragraphs: [
        "This policy applies to personal data collected through:",
      ],
      bullets: [
        "Our website at seedqura.com and seedqura.in (including subdomains and related pages)",
        "Seedqura Academy — course catalog, enrollment, and student accounts",
        "Contact, partnership, and application forms",
        "Account registration, login, and password recovery",
        "Payment processing for Academy courses",
        "Transactional and service-related email communications",
        "Live session scheduling (Google Meet / Google Calendar invitations where applicable)",
      ],
    },
    {
      id: "data-collected",
      title: "4. Personal Data We Collect",
      paragraphs: [
        "The personal data we collect depends on how you interact with us. Categories may include:",
      ],
      bullets: [
        "Identity & contact: full name, email address, phone number (where provided)",
        "Account data: login credentials (stored securely by our authentication provider; we do not store plaintext passwords)",
        "Profile data: role (student/admin), institution, academic year, portfolio or LinkedIn/GitHub URLs",
        "Communication data: messages sent via contact forms, application statements, subject lines",
        "Transaction data: course purchased, payment status, order identifiers, enrollment records (payment card details are processed directly by Razorpay — we do not store full card numbers)",
        "Technical data: IP address (for rate limiting and security), browser type, session cookies required for authentication",
        "Session data: Google Meet links and calendar metadata when you are enrolled in live cohort sessions",
      ],
    },
    {
      id: "purposes",
      title: "5. Purposes of Processing",
      paragraphs: [
        "We process personal data for specific, explicit, and legitimate purposes, including:",
      ],
      bullets: [
        "Creating and managing your account on our platform",
        "Processing Academy enrollments, payments, and access to purchased courses",
        "Scheduling and delivering live teaching sessions",
        "Responding to inquiries, partnership requests, and applications",
        "Sending transactional emails (welcome, payment confirmation, session reminders)",
        "Maintaining security, preventing fraud, and enforcing rate limits",
        "Complying with legal obligations and responding to lawful requests",
        "Improving our services (using aggregated or anonymised data where possible)",
      ],
    },
    {
      id: "lawful-basis",
      title: "6. Lawful Grounds for Processing",
      paragraphs: [
        "Under the DPDP Act, we rely on the following grounds as applicable:",
        "Where consent is the basis, you may withdraw consent at any time (see Section 12). Withdrawal does not affect processing already performed lawfully before withdrawal.",
      ],
      bullets: [
        "Consent — when you tick acceptance boxes, submit forms, register an account, or opt in to optional communications",
        "Performance of a contract — to provide Academy courses and services you purchase or register for",
        "Legitimate uses — as permitted under the DPDP Act for certain processing that is necessary and proportionate (e.g., security, fraud prevention)",
        "Legal obligation — where we must retain or disclose data to comply with applicable law",
      ],
    },
    {
      id: "cookies",
      title: "7. Cookies & Similar Technologies",
      paragraphs: [
        "We use essential cookies and local storage to maintain authenticated sessions (via Supabase) and to record your cookie/consent preferences.",
        "When you complete a payment, Razorpay may set third-party cookies as part of its checkout flow. See our Cookie Policy for details.",
        "We do not currently use advertising or analytics cookies. If this changes, we will update our Cookie Policy and request consent where required.",
      ],
    },
    {
      id: "processors",
      title: "8. Third-Party Processors",
      paragraphs: [
        "We use trusted service providers who process personal data on our behalf under contractual safeguards:",
        "These providers may process data on servers located outside India. Where personal data is transferred internationally, we take reasonable steps to ensure appropriate safeguards consistent with applicable law.",
      ],
      bullets: [
        "Supabase — authentication, database, and account storage",
        "Razorpay — payment processing (PCI-DSS compliant payment gateway)",
        "Resend — transactional email delivery",
        "Google (Calendar / Meet) — scheduling live Academy sessions and sending meeting invitations",
        "Vercel — website hosting and content delivery",
        "Render — backend API hosting (where applicable)",
      ],
    },
    {
      id: "retention",
      title: "9. Data Retention",
      paragraphs: [
        "We retain personal data only for as long as necessary to fulfil the purposes described in this policy, unless a longer period is required by law.",
      ],
      bullets: [
        "Account data: retained while your account is active and for a reasonable period thereafter (typically up to 3 years) for legal, accounting, or dispute resolution purposes",
        "Payment and enrollment records: retained as required for tax, accounting, and consumer protection obligations (typically 7 years or as mandated by law)",
        "Contact and application submissions: retained for up to 24 months unless a longer period is needed for ongoing correspondence",
        "Server logs and security data: retained for up to 90 days unless needed for incident investigation",
      ],
    },
    {
      id: "security",
      title: "10. Security Measures",
      paragraphs: [
        "We implement reasonable technical and organisational measures to protect personal data, including encrypted connections (HTTPS), access controls, authentication via industry-standard providers, and rate limiting on public forms.",
        "No method of transmission or storage is completely secure. If you believe your account has been compromised, contact us immediately at seedqura@gmail.com.",
      ],
    },
    {
      id: "children",
      title: "11. Children’s Data",
      paragraphs: [
        "Our services are intended primarily for adults and students aged 18 and above. We do not knowingly collect personal data from children under 18 without verifiable parental or guardian consent.",
        "If you are a parent or guardian and believe your child has provided personal data without consent, contact us at seedqura@gmail.com and we will take steps to delete such data.",
      ],
    },
    {
      id: "rights",
      title: "12. Your Rights as a Data Principal",
      paragraphs: [
        "Under the DPDP Act, you have the right to:",
        "To exercise these rights, email seedqura@gmail.com with sufficient detail to verify your identity. We will respond within the timelines prescribed under applicable law.",
      ],
      bullets: [
        "Access — request information about the personal data we hold about you",
        "Correction — request correction of inaccurate or incomplete personal data",
        "Erasure — request deletion of personal data where applicable (subject to legal retention requirements)",
        "Withdraw consent — where processing is based on consent",
        "Grievance redressal — raise a complaint with our Grievance Officer",
        "Nominate — nominate another individual to exercise your rights in the event of death or incapacity, as permitted under the DPDP Act",
      ],
    },
    {
      id: "grievance",
      title: "13. Grievance Redressal",
      paragraphs: [
        "If you have concerns about how we handle your personal data, contact our Grievance Officer:",
        "Email: seedqura@gmail.com",
        "We will acknowledge and endeavour to resolve grievances within 30 days of receipt, or within the period prescribed under the DPDP Act and applicable rules, whichever is shorter.",
        "If you are not satisfied with our response, you may have the right to approach the Data Protection Board of India as provided under the DPDP Act.",
      ],
    },
    {
      id: "breach",
      title: "14. Data Breach Notification",
      paragraphs: [
        "In the event of a personal data breach that is likely to affect you, we will take reasonable steps to notify affected Data Principals and relevant authorities as required under the DPDP Act and applicable rules.",
      ],
    },
    {
      id: "marketing",
      title: "15. Marketing Communications",
      paragraphs: [
        "We do not send unsolicited marketing email without your consent. Transactional and service-related messages (account, payment, session reminders) are sent as part of the services you use.",
        "You may opt out of optional marketing communications at any time by using the unsubscribe link (if provided) or contacting seedqura@gmail.com.",
      ],
    },
    {
      id: "changes",
      title: "16. Changes to This Policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated “Last updated” date. Where required by law, we will seek renewed consent.",
        "Last updated: 22 August 2026.",
      ],
    },
  ],
};
