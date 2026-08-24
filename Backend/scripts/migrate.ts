import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const COURSE_SEED = [
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

const LEGACY_COURSE_IDS = [
  "academy",
  "crop-vision",
  "clinical-ai",
  "remote-sensing",
  "research-pilots",
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

  if (LEGACY_COURSE_IDS.length > 0) {
    await client.query(
      `update public.courses
       set status = 'archived', updated_at = now()
       where id = any($1::text[])`,
      [LEGACY_COURSE_IDS]
    );
    console.log(`[migrate] archived ${LEGACY_COURSE_IDS.length} legacy courses`);
  }

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
