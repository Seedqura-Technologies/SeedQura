/**
 * Align calendar_sync_status constraint (pending | synced | failed | cancelled).
 * Usage: npx tsx scripts/migrate-calendar-sync-status.ts
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
    "20260824_calendar_sync_status.sql"
  );
  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  console.log("[migrate-calendar-sync-status] connecting…");
  await client.connect();
  await client.query(sql);
  await client.query(sql);
  const check = await client.query(`
    select conname, pg_get_constraintdef(oid) as def
    from pg_constraint
    where conrelid = 'public.course_sessions'::regclass
      and conname = 'course_sessions_calendar_sync_status_check'
  `);
  console.log("[migrate-calendar-sync-status] constraint", check.rows[0]);
  await client.end();
  console.log("[migrate-calendar-sync-status] done");
}

main().catch((err) => {
  console.error("[migrate-calendar-sync-status] failed", err);
  process.exit(1);
});
