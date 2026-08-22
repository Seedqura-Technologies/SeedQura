import type { LegalDocument } from "@/lib/legal";

export const cookiePolicy: LegalDocument = {
  slug: "cookies",
  title: "Cookie Policy",
  description:
    "How Seedqura uses cookies, local storage, and similar technologies on our website.",
  sections: [
    {
      id: "what",
      title: "1. What Are Cookies?",
      paragraphs: [
        "Cookies are small text files stored on your device when you visit a website. Similar technologies include local storage, session storage, and pixels. They help websites function, remember preferences, and maintain secure sessions.",
      ],
    },
    {
      id: "how-we-use",
      title: "2. How We Use Cookies",
      paragraphs: [
        "Seedqura uses cookies and local storage for essential functionality and consent management. We do not currently use advertising or analytics cookies.",
      ],
    },
    {
      id: "essential",
      title: "3. Strictly Necessary Cookies",
      paragraphs: [
        "These cookies are required for the website and account system to work. They cannot be disabled through our consent banner without affecting core functionality.",
      ],
      bullets: [
        "Authentication session cookies (Supabase) — maintain your logged-in state on dashboard, admin, and enrollment pages",
        "Security cookies — support secure connections and session refresh",
        "Consent preference storage — records your cookie/consent choices (stored in local storage and/or cookies)",
      ],
    },
    {
      id: "third-party",
      title: "4. Third-Party Cookies",
      paragraphs: [
        "When you complete a payment on our Academy checkout, Razorpay may set cookies or use similar technologies as part of its payment gateway. These are governed by Razorpay’s privacy and cookie policies.",
        "Google services (Calendar / Meet) may set cookies when you interact with meeting links sent for live Academy sessions.",
      ],
    },
    {
      id: "analytics",
      title: "5. Analytics & Marketing",
      paragraphs: [
        "We do not currently deploy Google Analytics, Meta Pixel, or similar tracking tools. If we introduce analytics in the future, we will update this policy and request consent where required under the DPDP Act.",
      ],
    },
    {
      id: "manage",
      title: "6. Managing Cookies",
      paragraphs: [
        "You can use our cookie banner to accept essential cookies only or accept all currently used categories.",
        "You may also control cookies through your browser settings (block, delete, or alert). Note that blocking essential cookies may prevent login and account features from working.",
        "To reset your consent preferences, clear site data for seedqura.com / seedqura.in in your browser or use the “Manage preferences” option in our cookie banner when available.",
      ],
    },
    {
      id: "retention",
      title: "7. Retention",
      paragraphs: [
        "Session cookies expire when you close your browser or after a period of inactivity as configured by our authentication provider.",
        "Consent preferences are retained until you clear them or we update our consent version.",
      ],
    },
    {
      id: "contact",
      title: "8. Contact",
      paragraphs: [
        "Questions about this Cookie Policy: seedqura@gmail.com",
        "Last updated: 22 August 2026.",
      ],
    },
  ],
};
