/**
 * Apply only the recurring-schedule delta (idempotent).
 * Prefer `npm run db:migrate` (full schema.sql) for normal setup.
 *
 * Usage: npx tsx scripts/migrate-schedule-rules.ts
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
    "20260824_course_schedule_rules.sql"
  );
  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  console.log("[migrate-schedule-rules] connecting…");
  await client.connect();
  console.log("[migrate-schedule-rules] applying delta…");
  await client.query(sql);

  const checks = await client.query(`
    select
      to_regclass('public.course_schedule_rules') is not null as rules_table,
      exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'course_sessions'
          and column_name = 'schedule_rule_id'
      ) as has_schedule_rule_id,
      exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'course_sessions'
          and column_name = 'calendar_sync_status'
      ) as has_calendar_sync_status,
      exists (
        select 1 from pg_indexes
        where schemaname = 'public'
          and indexname = 'course_sessions_rule_starts_uidx'
      ) as has_rule_starts_uidx
  `);

  console.log("[migrate-schedule-rules] verify:", checks.rows[0]);

  // Second apply must also succeed (idempotency smoke check)
  await client.query(sql);
  console.log("[migrate-schedule-rules] re-apply ok (idempotent)");

  await client.end();
  console.log("[migrate-schedule-rules] done");
}

main().catch((err) => {
  console.error("[migrate-schedule-rules] failed", err);
  process.exit(1);
});
