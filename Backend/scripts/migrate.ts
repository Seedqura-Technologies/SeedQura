import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const COURSE_SEED = [
  {
    id: "academy",
    name: "Seedqura Academy",
    tagline: "Research mentorship program",
    description:
      "A structured mentorship for students — guided projects in AI for agriculture and medicine, led by active researchers from leading institutions.",
    category: "Program",
    level: "Intermediate",
    duration: "12 weeks",
    format: "Live sessions + 1:1 mentorship",
    schedule_summary: "Weekly live sessions + mentorship",
    price_inr: 24999,
    currency: "INR",
    price_display: "₹24,999",
    status: "published",
    display_status: "Now Enrolling",
    featured: true,
    features: [
      "Mentor-led research projects",
      "Live foundational sessions",
      "Publication-oriented outcomes",
      "Certificate on completion",
    ],
  },
  {
    id: "crop-vision",
    name: "Crop Vision with PyTorch",
    tagline: "Computer vision for field intelligence",
    description:
      "Build and deploy disease-detection models for agricultural imagery — from dataset curation to edge-ready inference pipelines.",
    category: "Course",
    level: "Intermediate",
    duration: "6 weeks",
    format: "Self-paced + live labs",
    schedule_summary: "Self-paced with live lab sessions",
    price_inr: 4999,
    currency: "INR",
    price_display: "₹4,999",
    status: "published",
    display_status: "Open",
    featured: true,
    features: [
      "Multispectral & RGB pipelines",
      "Hands-on PyTorch projects",
      "Model evaluation frameworks",
      "Deployment walkthrough",
    ],
  },
  {
    id: "clinical-ai",
    name: "Clinical AI Fundamentals",
    tagline: "Medical imaging & decision support",
    description:
      "Introduction to hospital-grade AI workflows — imaging triage, clinical NLP, and responsible integration patterns for healthcare settings.",
    category: "Course",
    level: "Advanced",
    duration: "8 weeks",
    format: "Live cohort",
    schedule_summary: "Live cohort sessions",
    price_inr: 6999,
    currency: "INR",
    price_display: "₹6,999",
    status: "published",
    display_status: "Open",
    featured: false,
    features: [
      "X-ray & MRI triage basics",
      "Clinical pathway NLP",
      "Regulatory awareness module",
      "Case studies from pilots",
    ],
  },
  {
    id: "remote-sensing",
    name: "Remote Sensing for Agriculture",
    tagline: "Satellite analytics at scale",
    description:
      "Process aerial and satellite data for crop monitoring, yield estimation, and large-scale field intelligence using modern geospatial ML.",
    category: "Course",
    level: "Intermediate",
    duration: "5 weeks",
    format: "Self-paced",
    schedule_summary: "Self-paced",
    price_inr: null,
    currency: "INR",
    price_display: "Coming soon",
    status: "draft",
    display_status: "Coming Soon",
    featured: false,
    features: [
      "Sentinel & drone data workflows",
      "Time-series crop analytics",
      "GIS + ML integration",
      "Field deployment patterns",
    ],
  },
  {
    id: "research-pilots",
    name: "Research Pilots",
    tagline: "Enterprise & hospital partnerships",
    description:
      "Hospital and field deployment tools under active development. Partner with us for pilot programs tailored to your organization.",
    category: "Partnership",
    level: "Enterprise",
    duration: "Custom",
    format: "Dedicated engagement",
    schedule_summary: "Custom engagement",
    price_inr: null,
    currency: "INR",
    price_display: "Custom",
    status: "draft",
    display_status: "By inquiry",
    featured: false,
    features: [
      "Custom synthetic populations",
      "Validation studies",
      "On-site integration support",
      "Dedicated success manager",
    ],
  },
];

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) {
    throw new Error(
      "Set DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD"
    );
  }
  const host = new URL(url).hostname; // xxx.supabase.co
  const ref = host.split(".")[0];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  const sqlPath = join(__dirname, "..", "supabase", "schema.sql");
  const sql = readFileSync(sqlPath, "utf8");

  const client = new pg.Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  console.log("[migrate] connecting…");
  await client.connect();
  console.log("[migrate] applying schema…");
  await client.query(sql);

  for (const course of COURSE_SEED) {
    await client.query(
      `insert into public.courses (
        id, name, tagline, description, category, level, duration, format,
        schedule_summary, price_inr, currency, price_display, status,
        display_status, featured, features
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb
      )
      on conflict (id) do update set
        name = excluded.name,
        tagline = excluded.tagline,
        description = excluded.description,
        category = excluded.category,
        level = excluded.level,
        duration = excluded.duration,
        format = excluded.format,
        schedule_summary = excluded.schedule_summary,
        price_inr = excluded.price_inr,
        currency = excluded.currency,
        price_display = excluded.price_display,
        status = excluded.status,
        display_status = excluded.display_status,
        featured = excluded.featured,
        features = excluded.features,
        updated_at = now()`,
      [
        course.id,
        course.name,
        course.tagline,
        course.description,
        course.category,
        course.level,
        course.duration,
        course.format,
        course.schedule_summary,
        course.price_inr,
        course.currency,
        course.price_display,
        course.status,
        course.display_status,
        course.featured,
        JSON.stringify(course.features),
      ]
    );
  }
  console.log(`[migrate] seeded ${COURSE_SEED.length} courses`);
  await client.end();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (adminEmail && adminPassword && supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const list = await admin.auth.admin.listUsers({ perPage: 200 });
    let user = list.data.users.find(
      (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
    );

    if (!user) {
      const created = await admin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: "Seedqura Admin", role: "admin" },
      });
      if (created.error) throw created.error;
      user = created.data.user;
      console.log("[migrate] created admin user", adminEmail);
    } else {
      console.log("[migrate] admin user exists", adminEmail);
    }

    if (user) {
      await admin.from("profiles").upsert({
        id: user.id,
        email: adminEmail,
        full_name: "Seedqura Admin",
        role: "admin",
        status: "active",
      });
      console.log("[migrate] admin profile ensured");
    }
  } else {
    console.warn(
      "[migrate] skip admin bootstrap (set ADMIN_EMAIL + ADMIN_PASSWORD)"
    );
  }

  console.log("[migrate] done");
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});
