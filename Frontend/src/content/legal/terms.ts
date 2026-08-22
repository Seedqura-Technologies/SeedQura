import type { LegalDocument } from "@/lib/legal";

export const termsOfService: LegalDocument = {
  slug: "terms",
  title: "Terms of Service",
  description:
    "Terms governing your use of the Seedqura website, Academy platform, and related services.",
  sections: [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      paragraphs: [
        "These Terms of Service (“Terms”) constitute a legally binding agreement between you and Seedqura Technologies LLP (“Seedqura”, “we”, “us”) governing access to and use of our website, Academy, accounts, and related services (collectively, the “Services”).",
        "By accessing or using the Services, creating an account, submitting forms, or completing a purchase, you confirm that you have read, understood, and agree to these Terms and our Privacy Policy.",
        "If you do not agree, do not use the Services.",
      ],
    },
    {
      id: "eligibility",
      title: "2. Eligibility",
      paragraphs: [
        "You must be at least 18 years of age to create an account or purchase Academy courses independently. Users under 18 may use the Services only with verifiable consent and supervision of a parent or legal guardian.",
        "You represent that the information you provide is accurate, current, and complete, and that you will keep it updated.",
      ],
    },
    {
      id: "services",
      title: "3. Description of Services",
      paragraphs: [
        "Seedqura operates as an independent research lab focused on AI for precision medicine, and offers Seedqura Academy — live cohort-based courses and programs delivered online.",
        "Services include informational content about our research (NeuroVision, Sampoorna), contact and application forms, user accounts, course enrollment, payment processing, and access to purchased learning materials and live sessions.",
        "We may modify, suspend, or discontinue any part of the Services at any time with reasonable notice where practicable.",
      ],
    },
    {
      id: "accounts",
      title: "4. Accounts & Security",
      paragraphs: [
        "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
        "Notify us immediately at gethelp.seedqura@gmail.com if you suspect unauthorised access.",
        "We reserve the right to suspend or terminate accounts that violate these Terms, applicable law, or pose a security risk.",
      ],
    },
    {
      id: "academy",
      title: "5. Academy Enrollment & Access",
      paragraphs: [
        "Course descriptions, pricing, schedules, and deliverables are described on the Academy pages. By enrolling and completing payment, you enter into a contract for the specific course purchased.",
        "Access to live sessions, materials, and dashboard features is personal to the enrolled account holder and may not be shared, resold, or redistributed without our written consent.",
        "We may reschedule or substitute instructors for live sessions with reasonable notice. See our Refund Policy for cancellation and refund terms.",
      ],
    },
    {
      id: "payments",
      title: "6. Payments",
      paragraphs: [
        "Payments are processed through Razorpay. By completing a purchase, you also agree to Razorpay’s applicable terms and privacy practices for payment processing.",
        "Prices are listed in Indian Rupees (INR) unless stated otherwise and include applicable taxes only where explicitly indicated.",
        "Failed or disputed payments may result in suspension of course access until resolved.",
      ],
    },
    {
      id: "ip",
      title: "7. Intellectual Property",
      paragraphs: [
        "All content on the Services — including text, graphics, logos, course materials, software, research descriptions, and branding — is owned by Seedqura or its licensors and protected by applicable intellectual property laws.",
        "You receive a limited, non-exclusive, non-transferable licence to access purchased course materials for personal, non-commercial learning purposes only.",
        "You may not copy, modify, distribute, reverse engineer, or create derivative works from our content except as expressly permitted.",
      ],
    },
    {
      id: "acceptable-use",
      title: "8. Acceptable Use",
      paragraphs: [
        "You agree not to:",
      ],
      bullets: [
        "Use the Services for unlawful, harmful, or fraudulent purposes",
        "Upload malware, attempt unauthorised access, or interfere with platform security",
        "Harass, abuse, or impersonate others",
        "Scrape, crawl, or automate access in a manner that burdens our infrastructure",
        "Misrepresent affiliation with Seedqura or use our brand without permission",
        "Share account credentials or course access with third parties",
      ],
    },
    {
      id: "research-disclaimer",
      title: "9. Research & Medical Disclaimer",
      paragraphs: [
        "Seedqura’s research systems (including NeuroVision and Sampoorna) and website content are for research, educational, and informational purposes only.",
        "Nothing on the Services constitutes medical advice, diagnosis, treatment, or a substitute for professional healthcare. Always consult qualified healthcare professionals for medical decisions.",
        "Our AI tools and research outputs may contain errors or limitations and are not approved medical devices unless explicitly stated in a regulated context.",
      ],
    },
    {
      id: "third-party",
      title: "10. Third-Party Services",
      paragraphs: [
        "The Services integrate with third-party providers (e.g., Supabase, Razorpay, Google Meet, Resend). Your use of those services may be subject to their separate terms and policies.",
        "We are not responsible for third-party websites, services, or content linked from our platform.",
      ],
    },
    {
      id: "disclaimers",
      title: "11. Disclaimers",
      paragraphs: [
        "The Services are provided on an “as is” and “as available” basis to the fullest extent permitted by law. We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.",
        "We do not guarantee uninterrupted, error-free, or secure operation of the Services.",
      ],
    },
    {
      id: "liability",
      title: "12. Limitation of Liability",
      paragraphs: [
        "To the maximum extent permitted by applicable law, Seedqura and its directors, partners, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or goodwill arising from your use of the Services.",
        "Our aggregate liability for any claim arising from these Terms or the Services shall not exceed the amount you paid to Seedqura in the twelve (12) months preceding the claim, or INR 5,000, whichever is greater, except where liability cannot be limited under applicable law.",
      ],
    },
    {
      id: "indemnity",
      title: "13. Indemnification",
      paragraphs: [
        "You agree to indemnify and hold harmless Seedqura from claims, damages, losses, and expenses (including reasonable legal fees) arising from your violation of these Terms, misuse of the Services, or infringement of third-party rights.",
      ],
    },
    {
      id: "termination",
      title: "14. Termination",
      paragraphs: [
        "You may stop using the Services at any time. We may suspend or terminate access for breach of these Terms, legal compliance, or operational reasons.",
        "Provisions that by nature should survive termination (including intellectual property, disclaimers, limitation of liability, and governing law) will survive.",
      ],
    },
    {
      id: "governing-law",
      title: "15. Governing Law & Disputes",
      paragraphs: [
        "These Terms are governed by the laws of India. Courts at New Delhi, India shall have exclusive jurisdiction, subject to applicable consumer protection laws that may provide alternative forums.",
        "We encourage you to contact us first at gethelp.seedqura@gmail.com or seedqura@gmail.com to resolve disputes amicably.",
      ],
    },
    {
      id: "changes",
      title: "16. Changes to Terms",
      paragraphs: [
        "We may update these Terms from time to time. Continued use after posting of revised Terms constitutes acceptance where permitted by law. Material changes may require renewed acceptance on login or checkout.",
        "Last updated: 22 August 2026.",
      ],
    },
  ],
};
