/**
 * Unique Razorpay order ids and one open gateway order per enrollment.
 * Usage: npx tsx scripts/migrate-payment-concurrency.ts
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
  const sql = readFileSync(
    join(__dirname, "..", "supabase", "migrations", "20260927_payment_concurrency.sql"),
    "utf8"
  );
  const client = new pg.Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  console.log("[migrate-payment-concurrency] connecting…");
  await client.connect();
  await client.query(sql);
  const idx = await client.query(
    "select indexname from pg_indexes where tablename = 'payments' and indexname = 'payments_razorpay_order_id_uidx'"
  );
  console.log(
    "[migrate-payment-concurrency] indexes",
    idx.rows.map((row: { indexname: string }) => row.indexname).join(", ")
  );
  await client.end();
}

main().catch((err) => {
  console.error("[migrate-payment-concurrency] failed", err);
  process.exit(1);
});
