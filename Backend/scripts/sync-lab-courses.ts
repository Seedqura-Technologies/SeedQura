import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const KEEP = ["frameworks-lab", "signal-lab", "groundtruth-lab", "research-fellowship"] as const;

const LAB_COURSES = [
  {
    id: "frameworks-lab",
    name: "Frameworks Lab",
    tagline: "See the world in code.",
    description:
      "Build vision systems that run, not slide decks. Leave with projects recruiters can open and run.",
    category: "Course",
    level: "Beginner–Intermediate",
    duration: "4 weeks",
    format: "Sat & Sun · 8 live classes",
    schedule_summary: "8 live hours · 4 weekends · Campus Vision project",
    price_inr: 4999,
    currency: "INR",
    price_display: "₹4,999",
    status: "published",
    display_status: "Open",
    featured: true,
    features: [
      "Runnable vision projects",
      "GitHub portfolio employers can run",
      "Images to live models",
    ],
  },
  {
    id: "signal-lab",
    name: "Signal Lab",
    tagline: "Models that answer real questions.",
    description:
      "Frame a business problem, train a model, deploy it live. One portfolio that proves the full loop.",
    category: "Course",
    level: "Beginner–Intermediate",
    duration: "4 weeks",
    format: "Sat & Sun · 8 live classes",
    schedule_summary: "8 live hours · 4 weekends · Student Success Predictor project",
    price_inr: 4999,
    currency: "INR",
    price_display: "₹4,999",
    status: "published",
    display_status: "Open",
    featured: true,
    features: [
      "Live prediction API",
      "Messy data to trained models",
      "Question to production on GitHub",
    ],
  },
  {
    id: "groundtruth-lab",
    name: "Groundtruth Lab",
    tagline: "Truth before training.",
    description:
      "Design labels and quality systems ML teams trust. Prove it with a portfolio, not promises.",
    category: "Course",
    level: "Beginner",
    duration: "4 weeks",
    format: "Sat & Sun · 8 live classes",
    schedule_summary: "8 live hours · 4 weekends · Campus Safety Labeling Kit project",
    price_inr: 4999,
    currency: "INR",
    price_display: "₹4,999",
    status: "published",
    display_status: "Open",
    featured: true,
    features: [
      "Data ML teams trust",
      "Labels that scale cleanly",
      "Portfolio proof for data ops",
    ],
  },
  {
    id: "research-fellowship",
    name: "Research Fellowship",
    tagline: "Research you can publish.",
    description:
      "Three months in a six-person group on one serious AI problem. Exit with research-grade work, not certificates.",
    category: "Program",
    level: "Intermediate–Advanced",
    duration: "3 months",
    format: "Live weekends · groups of 6",
    schedule_summary:
      "3 months · 30 seats · 5 research groups · publication-oriented output",
    price_inr: 19999,
    currency: "INR",
    price_display: "₹19,999 · incl. GST",
    status: "published",
    display_status: "Applications Open",
    featured: true,
    seat_limit: 30,
    features: [
      "Research-grade project and report",
      "One domain, one deep problem",
      "Manuscript-ready publication path",
    ],
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: listErr } = await admin.from("courses").select("id");
  if (listErr) throw listErr;

  const toRemove = (existing ?? []).map((c) => c.id).filter((id) => !KEEP.includes(id as (typeof KEEP)[number]));
  if (toRemove.length > 0) {
    const { error: delErr } = await admin.from("courses").delete().in("id", toRemove);
    if (delErr) throw delErr;
    console.log("[sync-lab-courses] removed:", toRemove.join(", "));
  } else {
    console.log("[sync-lab-courses] no legacy courses to remove");
  }

  for (const course of LAB_COURSES) {
    const { error } = await admin.from("courses").upsert(course, { onConflict: "id" });
    if (error) throw error;
  }

  const { data: final, error: finalErr } = await admin
    .from("courses")
    .select("id, name, price_inr, status")
    .order("name");
  if (finalErr) throw finalErr;

  console.log("[sync-lab-courses] courses in database:");
  for (const row of final ?? []) {
    console.log(`  - ${row.id} (${row.name}) ₹${row.price_inr} [${row.status}]`);
  }
}

main().catch((err) => {
  console.error("[sync-lab-courses] failed", err);
  process.exit(1);
});
