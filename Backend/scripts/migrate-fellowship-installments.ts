/**
 * Apply fellowship installment ledger migration (3 × ₹6,999).
 * Usage: npm run db:migrate:fellowship-installments
 */
import "dotenv/config";
import { ensureFellowshipInstallmentsSchema } from "../src/lib/ensure-fellowship-installments.js";

ensureFellowshipInstallmentsSchema()
  .then(() => {
    console.log("[migrate:installments] complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[migrate:installments] failed", err);
    process.exit(1);
  });
