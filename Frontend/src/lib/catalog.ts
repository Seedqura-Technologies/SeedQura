import { getCourses } from "@/lib/data";

export type CatalogCourse = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  format: string;
  priceDisplay: string;
  status: string;
  featured: boolean;
  features: string[];
  price_inr: number | null;
  cta: { label: string; href: string };
};

type ApiCourse = {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  duration?: string | null;
  format?: string | null;
  price_display?: string | null;
  priceDisplay?: string;
  display_status?: string | null;
  status?: string;
  featured?: boolean;
  features?: string[] | null;
  price_inr?: number | null;
  price?: number | null;
};

export function mapToCatalogCourse(c: ApiCourse): CatalogCourse {
  const price =
    c.price_inr != null
      ? Number(c.price_inr)
      : c.price != null
        ? Number(c.price)
        : null;
  const enrollable = price != null && price > 0;
  return {
    id: c.id,
    name: c.name,
    tagline: c.tagline || "",
    description: c.description || "",
    category: c.category || "Course",
    level: c.level || "",
    duration: c.duration || "",
    format: c.format || "",
    priceDisplay: c.price_display || c.priceDisplay || "—",
    status: c.display_status || (typeof c.status === "string" ? c.status : "") || "",
    featured: !!c.featured,
    features: Array.isArray(c.features) ? c.features : [],
    price_inr: price,
    cta: enrollable
      ? { label: "Enroll Now", href: `/enroll/${c.id}` }
      : { label: "Get In Touch", href: "/#contact" },
  };
}

export function jsonCatalogFallback(): CatalogCourse[] {
  return getCourses().map((c) =>
    mapToCatalogCourse({
      id: c.id,
      name: c.name,
      tagline: c.tagline,
      description: c.description,
      category: c.category,
      level: c.level,
      duration: c.duration,
      format: c.format,
      priceDisplay: c.priceDisplay,
      display_status: c.status,
      featured: c.featured,
      features: c.features,
      price: c.price,
    })
  );
}

export async function fetchPublishedCourses(): Promise<CatalogCourse[]> {
  try {
    const res = await fetch("/api/courses", { cache: "no-store" });
    if (!res.ok) throw new Error("courses api failed");
    const data = await res.json();
    const list = Array.isArray(data.courses) ? data.courses : [];
    if (list.length === 0) return jsonCatalogFallback();
    return list.map(mapToCatalogCourse);
  } catch {
    return jsonCatalogFallback();
  }
}
