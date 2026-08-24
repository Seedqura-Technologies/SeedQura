import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const KEEP = ["frameworks-lab", "signal-lab", "groundtruth-lab"] as const;

const LAB_COURSES = [
  {
    id: "frameworks-lab",
    name: "Frameworks Lab",
    tagline: "See with code — ship vision projects",
    description:
      "Build end-to-end computer vision skills — from raw images and cleaning to classification, detection, and a GitHub portfolio employers can click and run.",
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
      "Image pipelines with OpenCV",
      "Hands-on PyTorch projects",
      "Classification + detection demos",
      "Portfolio-ready GitHub repos",
    ],
  },
  {
    id: "signal-lab",
    name: "Signal Lab",
    tagline: "Business question → deployed model",
    description:
      "Go from a real business problem to clean data, trained models, and a live prediction API — then package the full workflow as a GitHub portfolio recruiters can run.",
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
      "Business → ML problem framing",
      "EDA, cleaning & feature craft",
      "Model training & evaluation",
      "FastAPI deploy + portfolio",
    ],
  },
  {
    id: "groundtruth-lab",
    name: "Groundtruth Lab",
    tagline: "Label data like a pro — ML-ready handoff",
    description:
      "Design taxonomies, label real images, run quality checks, and ship documentation an ML engineer can import tomorrow — a GitHub portfolio that proves you belong in AI data ops.",
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
      "Taxonomy & guideline design",
      "Hands-on Label Studio labeling",
      "QA scripts & quality checks",
      "ML handoff docs + portfolio",
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
