/**
 * Apply fellowship_selections table migration.
 * Usage: npm run db:migrate:fellowship-selections
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dns from "node:dns/promises";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function pgClient(): Promise<pg.Client> {
  if (process.env.DATABASE_URL) {
    return new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    });
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) {
    throw new Error(
      "Set DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD"
    );
  }

  const ref = new URL(url).hostname.split(".")[0];
  const host = `db.${ref}.supabase.co`;
  let resolvedHost = host;
  try {
    const v6 = await dns.resolve6(host);
    if (v6[0]) resolvedHost = v6[0];
  } catch {
    try {
      const lookedUp = await dns.lookup(host);
      resolvedHost = lookedUp.address;
    } catch {
      // Use hostname as last resort.
    }
  }

  return new pg.Client({
    host: resolvedHost,
    port: 5432,
    user: "postgres",
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
}

async function main() {
  const sqlPath = join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20260901_fellowship_selections.sql"
  );
  const sql = readFileSync(sqlPath, "utf8");
  const client = await pgClient();
  console.log("[migrate-fellowship-selections] connecting…");
  await client.connect();
  console.log("[migrate-fellowship-selections] applying…");
  await client.query(sql);

  const verify = await client.query(`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'fellowship_selections'
    ) as table_exists
  `);
  console.log("[migrate-fellowship-selections] verify", verify.rows[0]);
  if (!verify.rows[0]?.table_exists) {
    throw new Error("fellowship_selections table missing");
  }

  await client.end();
  console.log("[migrate-fellowship-selections] done");
}

main().catch((err) => {
  console.error("[migrate-fellowship-selections] failed", err);
  process.exit(1);
});
