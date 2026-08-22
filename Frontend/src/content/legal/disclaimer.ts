import type { LegalDocument } from "@/lib/legal";

export const disclaimer: LegalDocument = {
  slug: "disclaimer",
  title: "Disclaimer",
  description:
    "Important limitations regarding Seedqura research, AI systems, and website content.",
  sections: [
    {
      id: "general",
      title: "1. General Information Only",
      paragraphs: [
        "Content on the Seedqura website — including research descriptions, blog-style copy, course overviews, and product narratives — is provided for general informational and educational purposes.",
        "It does not constitute professional, medical, legal, or financial advice.",
      ],
    },
    {
      id: "medical",
      title: "2. Not Medical Advice",
      paragraphs: [
        "Seedqura builds AI research systems for precision medicine. Nothing on this website or in our courses is intended to diagnose, treat, cure, or prevent any disease or health condition.",
        "NeuroVision, Sampoorna, and related projects are research and educational initiatives unless and until explicitly validated, regulated, and deployed in approved clinical settings with appropriate approvals.",
        "Always seek advice from qualified healthcare professionals for medical concerns. Do not disregard professional medical advice because of something you read on our website.",
      ],
    },
    {
      id: "ai-limitations",
      title: "3. AI & Research Limitations",
      paragraphs: [
        "AI models and research prototypes may produce incorrect, incomplete, or biased outputs. They are not substitutes for expert clinical judgment, imaging review by qualified radiologists, or standard-of-care protocols.",
        "Demonstrations, screenshots, and descriptions may reflect work-in-progress systems that differ from any future commercial or clinical product.",
      ],
    },
    {
      id: "academy",
      title: "4. Academy & Educational Content",
      paragraphs: [
        "Seedqura Academy courses teach concepts, methods, and practices in medical AI and related fields. Completion of a course does not confer professional licensure, board certification, or clinical privileges.",
        "Students are responsible for complying with applicable laws, institutional policies, and ethical guidelines in their own work.",
      ],
    },
    {
      id: "third-party",
      title: "5. Third-Party Links & References",
      paragraphs: [
        "Links to external websites or references to third-party tools are provided for convenience. We do not endorse and are not responsible for third-party content or practices.",
      ],
    },
    {
      id: "liability",
      title: "6. Limitation",
      paragraphs: [
        "To the fullest extent permitted by law, Seedqura Technologies LLP disclaims liability for any reliance on website content, research descriptions, or educational materials. See our Terms of Service for full limitation of liability provisions.",
        "Last updated: 22 August 2026.",
      ],
    },
  ],
};
