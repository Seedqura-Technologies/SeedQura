import type { MetadataRoute } from "next";
import { getLabCourseDetailIds } from "@/content/academy/lab-courses";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.seedqura.com";
  const lastModified = new Date();

  const pages = [
    "",
    "/about",
    "/research",
    "/academy",
    ...getLabCourseDetailIds().map((id) => `/academy/${id}`),
    "/apply",
    "/privacy",
    "/terms",
    "/cookies",
    "/refund-policy",
    "/disclaimer",
  ];

  return pages.map((path, i) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path.startsWith("/privacy") || path.startsWith("/terms") ? "yearly" as const : "monthly" as const,
    priority: path === "" ? 1 : path.match(/^\/(privacy|terms|cookies|refund|disclaimer)/) ? 0.5 : 0.8,
  }));
}
