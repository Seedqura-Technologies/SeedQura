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
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildPgClients(): Promise<pg.Client[]> {
  const clients: pg.Client[] = [];

  if (process.env.DATABASE_URL) {
    clients.push(
      new pg.Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("localhost")
          ? undefined
          : { rejectUnauthorized: false },
      })
    );
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) return clients;

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
      // hostname fallback below
    }
  }

  clients.push(
    new pg.Client({
      host: resolvedHost,
      port: 5432,
      user: "postgres",
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
    })
  );

  for (const region of [
    "ap-south-1",
    "ap-southeast-1",
    "us-east-1",
    "eu-west-1",
  ]) {
    clients.push(
      new pg.Client({
        host: `aws-0-${region}.pooler.supabase.com`,
        port: 5432,
        user: `postgres.${ref}`,
        password,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 12_000,
      })
    );
  }

  return clients;
}

async function connectPg(): Promise<pg.Client> {
  const clients = await buildPgClients();
  if (clients.length === 0) {
    throw new Error(
      "Set DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD"
    );
  }

  const errors: string[] = [];
  for (const client of clients) {
    try {
      await client.connect();
      await client.query("select 1");
      return client;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }

  throw new Error(
    `Could not connect to Postgres (${errors.length} attempts). Run the SQL file in Supabase SQL Editor instead.`
  );
}

async function verifyPostgrest(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("[migrate-fellowship-selections] skip PostgREST verify (no service key)");
    return;
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.from("fellowship_selections").select("email").limit(1);
  if (error) {
    throw new Error(
      `Table exists in Postgres but PostgREST still cannot read it: ${error.message}. Wait 30s and retry, or run NOTIFY pgrst, 'reload schema'; in SQL Editor.`
    );
  }
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
  const client = await connectPg();
  console.log("[migrate-fellowship-selections] connected");
  console.log("[migrate-fellowship-selections] applying…");
  await client.query(sql);

  const verify = await client.query(`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'fellowship_selections'
    ) as table_exists
  `);
  console.log("[migrate-fellowship-selections] postgres verify", verify.rows[0]);
  if (!verify.rows[0]?.table_exists) {
    throw new Error("fellowship_selections table missing after migration");
  }

  await client.end();
  await verifyPostgrest();
  console.log("[migrate-fellowship-selections] PostgREST verify ok");
  console.log("[migrate-fellowship-selections] done");
}

main().catch((err) => {
  console.error("[migrate-fellowship-selections] failed", err);
  process.exit(1);
});
