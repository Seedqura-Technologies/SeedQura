/**
 * Add calendar_invite_via + ics_invite_sent_at on course_sessions.
 * Usage: npx tsx scripts/migrate-session-calendar-invites.ts
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
    "20260824_session_calendar_invites.sql"
  );
  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  console.log("[migrate-session-calendar-invites] connecting…");
  await client.connect();
  await client.query(sql);
  await client.query(sql);
  const check = await client.query(`
    select exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='course_sessions'
        and column_name='calendar_invite_via'
    ) as has_calendar_invite_via,
    exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='course_sessions'
        and column_name='ics_invite_sent_at'
    ) as has_ics_invite_sent_at
  `);
  console.log("[migrate-session-calendar-invites] verify", check.rows[0]);
  await client.end();
  console.log("[migrate-session-calendar-invites] done");
}

main().catch((err) => {
  console.error("[migrate-session-calendar-invites] failed", err);
  process.exit(1);
});
