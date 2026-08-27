/**
 * UTR enroll columns + awaiting_verification payment_status.
 * Usage: npx tsx scripts/migrate-utr-enroll.ts
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) {
    throw new Error(
      "Set DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD"
    );
  }
  const host = new URL(url).hostname;
  const ref = host.split(".")[0];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  const sqlPath = join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20260826_utr_enroll.sql"
  );
  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  console.log("[migrate-utr-enroll] connecting…");
  await client.connect();
  console.log("[migrate-utr-enroll] applying…");
  await client.query(sql);

  const verify = await client.query(`
    select
      (select count(*) from information_schema.columns
        where table_schema = 'public' and table_name = 'enrollments'
          and column_name in (
            'utr','institution','degree','year_of_study',
            'applicant_phone','applicant_name','utr_submitted_at'
          ))::int as utr_columns,
      (select pg_get_constraintdef(c.oid)
        from pg_constraint c
        join pg_class t on c.conrelid = t.oid
        join pg_namespace n on t.relnamespace = n.oid
        where n.nspname = 'public' and t.relname = 'enrollments'
          and c.conname = 'enrollments_payment_status_check') as payment_check,
      (select count(*) from public.enrollments
        where payment_status in ('pending','paid','failed','refunded','awaiting_verification')
      )::int as valid_payment_rows,
      (select count(*) from public.enrollments)::int as total_enrollments
  `);
  console.log("[migrate-utr-enroll] verify", verify.rows[0]);
  if (verify.rows[0]?.utr_columns !== 7) {
    throw new Error("Expected 7 UTR columns on enrollments");
  }
  if (!String(verify.rows[0]?.payment_check || "").includes("awaiting_verification")) {
    throw new Error("payment_status check missing awaiting_verification");
  }
  if (verify.rows[0]?.valid_payment_rows !== verify.rows[0]?.total_enrollments) {
    throw new Error("Some enrollments have unexpected payment_status values");
  }

  await client.end();
  console.log("[migrate-utr-enroll] done");
}

main().catch((err) => {
  console.error("[migrate-utr-enroll] failed", err);
  process.exit(1);
});
