import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createPgClient } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Idempotent prod bootstrap: ensure fellowship installment columns + 'partial'
 * payment_status exist. Safe to run on every boot.
 */
export async function ensureFellowshipInstallmentsSchema(): Promise<void> {
  let client;
  try {
    client = createPgClient();
    await client.connect();
  } catch (err) {
    console.warn(
      "[migrate:installments] skip — database URL unavailable:",
      err instanceof Error ? err.message : err
    );
    return;
  }

  try {
    const { rows } = await client.query<{ exists: boolean }>(
      `select exists (
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'enrollments'
           and column_name = 'payment_plan'
       ) as exists`
    );
    const hasColumn = Boolean(rows[0]?.exists);

    const { rows: statusRows } = await client.query<{ ok: boolean }>(
      `select exists (
         select 1
         from pg_constraint c
         join pg_class t on t.oid = c.conrelid
         join pg_namespace n on n.oid = t.relnamespace
         where n.nspname = 'public'
           and t.relname = 'enrollments'
           and c.contype = 'c'
           and pg_get_constraintdef(c.oid) ilike '%partial%'
           and pg_get_constraintdef(c.oid) ilike '%payment_status%'
       ) as ok`
    );
    const hasPartial = Boolean(statusRows[0]?.ok);

    if (hasColumn && hasPartial) {
      console.log("[migrate:installments] already applied");
      return;
    }

    const sqlPath = join(
      __dirname,
      "..",
      "..",
      "supabase",
      "migrations",
      "20261001_fellowship_installments.sql"
    );
    const sql = readFileSync(sqlPath, "utf8");
    console.log("[migrate:installments] applying…");
    await client.query(sql);
    console.log("[migrate:installments] done");
  } catch (err) {
    console.error(
      "[migrate:installments] failed:",
      err instanceof Error ? err.message : err
    );
    throw err;
  } finally {
    await client.end().catch(() => undefined);
  }
}
