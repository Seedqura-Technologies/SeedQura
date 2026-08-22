import type { LegalDocument } from "@/lib/legal";

export const refundPolicy: LegalDocument = {
  slug: "refund-policy",
  title: "Refund & Cancellation Policy",
  description:
    "Refund and cancellation terms for Seedqura Academy courses and payments.",
  sections: [
    {
      id: "scope",
      title: "1. Scope",
      paragraphs: [
        "This Refund & Cancellation Policy applies to paid enrollments in Seedqura Academy courses processed through our website and Razorpay.",
        "By purchasing a course, you agree to this policy in addition to our Terms of Service and Privacy Policy.",
      ],
    },
    {
      id: "before-start",
      title: "2. Before Course Start",
      paragraphs: [
        "If you request a cancellation at least 7 (seven) calendar days before the published start date of your cohort, you may be eligible for a full refund minus payment gateway charges actually incurred by us, if any.",
        "Refund requests must be emailed to gethelp.seedqura@gmail.com from the email address associated with your account, including your order/enrollment details.",
      ],
    },
    {
      id: "after-start",
      title: "3. After Course Start",
      paragraphs: [
        "Once a cohort has started or you have accessed live session materials, refunds are generally not available except where required by applicable consumer protection law or at our sole discretion in exceptional circumstances (e.g., serious service failure on our part).",
        "Partial refunds, credits toward future cohorts, or session rescheduling may be offered case-by-case.",
      ],
    },
    {
      id: "seedqura-cancellation",
      title: "4. Cancellation by Seedqura",
      paragraphs: [
        "If we cancel a course or cohort before delivery, you will receive a full refund of the amount paid for that enrollment, processed to the original payment method where possible, within 14 business days.",
        "If we reschedule a cohort, you may choose to transfer enrollment to the new dates or request a refund as above.",
      ],
    },
    {
      id: "processing",
      title: "5. Refund Processing",
      paragraphs: [
        "Approved refunds are initiated through Razorpay to the original payment method. Processing times depend on your bank or card issuer (typically 5–10 business days after initiation).",
        "We will confirm refund approval or denial by email.",
      ],
    },
    {
      id: "failed-payments",
      title: "6. Failed or Duplicate Payments",
      paragraphs: [
        "If a payment fails but an amount was debited, contact gethelp.seedqura@gmail.com with transaction details. We will work with Razorpay to investigate.",
        "Duplicate charges verified by our records will be refunded.",
      ],
    },
    {
      id: "contact",
      title: "7. Contact",
      paragraphs: [
        "Refund requests and questions: gethelp.seedqura@gmail.com",
        "Grievance related to billing: seedqura@gmail.com",
        "Last updated: 22 August 2026.",
      ],
    },
  ],
};
