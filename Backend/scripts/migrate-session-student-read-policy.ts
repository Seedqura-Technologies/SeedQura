/**
 * Restrict student RLS reads of course_sessions to published/announced rows.
 * Usage: npx tsx scripts/migrate-session-student-read-policy.ts
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
    "20260824_session_student_read_policy.sql"
  );
  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  console.log("[migrate-session-student-read-policy] connecting…");
  await client.connect();
  await client.query(sql);
  const check = await client.query(`
    select pol.polname
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'course_sessions'
      and pol.polname = 'Enrolled students read course sessions'
  `);
  console.log("[migrate-session-student-read-policy] verify", check.rows);
  await client.end();
  console.log("[migrate-session-student-read-policy] done");
}

main().catch((err) => {
  console.error("[migrate-session-student-read-policy] failed", err);
  process.exit(1);
});
