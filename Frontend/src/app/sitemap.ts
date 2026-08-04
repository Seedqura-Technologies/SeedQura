import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://seedqura.in";
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/products`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/research`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/apply`, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];
}
