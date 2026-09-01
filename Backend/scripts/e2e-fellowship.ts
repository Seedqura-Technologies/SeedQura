/**
 * Fellowship flow E2E — selection gate + admin allow-list + UTR payment.
 *
 * Usage (from Backend/):
 *   npm run test:e2e:fellowship
 *
 * Env (from Backend/.env):
 *   API_URL (default http://localhost:3001)
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

type StepResult = { name: string; ok: boolean; detail?: string; ms: number };

const API = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const FELLOWSHIP_ID = "research-fellowship";

const stamp = Date.now().toString(36);
const STUDENT_EMAIL = `e2e.fellowship.${stamp}@seedqura.test`;
const STUDENT_PASSWORD = `E2eFell!${stamp}Aa1`;
const STUDENT_NAME = `E2E Fellowship ${stamp}`;
const UTR = `FEL${stamp.toUpperCase()}UTR99`.slice(0, 22);

const results: StepResult[] = [];
let studentId: string | null = null;
let enrollmentId: string | null = null;

function fail(msg: string): never {
  throw new Error(msg);
}

async function step(name: string, fn: () => Promise<string | void>) {
  const t0 = Date.now();
  try {
    const detail = (await fn()) || "ok";
    results.push({ name, ok: true, detail: String(detail), ms: Date.now() - t0 });
    console.log(`  ✓ ${name} (${Date.now() - t0}ms)`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, detail, ms: Date.now() - t0 });
    console.error(`  ✗ ${name} (${Date.now() - t0}ms): ${detail}`);
    throw err;
  }
}

async function api(
  path: string,
  opts: {
    method?: string;
    token?: string | null;
    body?: unknown;
    timeoutMs?: number;
  } = {}
) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 90_000);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

    const res = await fetch(`${API}${path}`, {
      method: opts.method || (opts.body !== undefined ? "POST" : "GET"),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  } finally {
    clearTimeout(timer);
  }
}

async function signIn(email: string, password: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session?.access_token) {
    fail(error?.message || "No access token after sign-in");
  }
  return data.session!.access_token;
}

async function cleanup() {
  if (!SERVICE_KEY) return;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  try {
    await admin
      .from("fellowship_selections")
      .delete()
      .eq("email", STUDENT_EMAIL.toLowerCase());
    if (enrollmentId) {
      await admin.from("payments").delete().eq("enrollment_id", enrollmentId);
      await admin.from("enrollments").delete().eq("id", enrollmentId);
    }
    if (studentId) {
      await admin.from("enrollments").delete().eq("user_id", studentId);
      await admin.from("notifications").delete().eq("user_id", studentId);
      await admin.from("profiles").delete().eq("id", studentId);
      await admin.auth.admin.deleteUser(studentId);
    }
    console.log(`  · cleaned up ${STUDENT_EMAIL}`);
  } catch (err) {
    console.warn(
      "  · cleanup warning:",
      err instanceof Error ? err.message : err
    );
  }
}

async function main() {
  console.log(`\nFellowship E2E → ${API}`);
  console.log(`Student: ${STUDENT_EMAIL}\n`);

  if (!SUPABASE_URL || !ANON_KEY) {
    fail("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY");
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    fail("Missing ADMIN_EMAIL / ADMIN_PASSWORD");
  }

  await step("API health", async () => {
    const { res, data } = await api("/health", { timeoutMs: 120_000 });
    if (!res.ok || !data.ok) fail(`health ${res.status}`);
    return "ok";
  });

  await step("Research fellowship course published", async () => {
    const { res, data } = await api(`/api/courses/${FELLOWSHIP_ID}`);
    if (!res.ok) fail(`course ${res.status}`);
    if (data.course?.price_inr !== 19999) {
      fail(`price_inr=${data.course?.price_inr}`);
    }
    return `₹${data.course.price_inr}`;
  });

  await step("Student register", async () => {
    const { res, data } = await api("/api/student/register", {
      body: {
        email: STUDENT_EMAIL,
        password: STUDENT_PASSWORD,
        fullName: STUDENT_NAME,
      },
    });
    if (!res.ok) fail(data.error || `register ${res.status}`);
    studentId = data.userId || null;
    if (!studentId) fail("no userId");
    return studentId;
  });

  let studentToken = "";
  await step("Student login", async () => {
    studentToken = await signIn(STUDENT_EMAIL, STUDENT_PASSWORD);
    return "ok";
  });

  await step("Fellowship blocked before selection (eligibility)", async () => {
    const { res, data } = await api(
      `/api/payments/fellowship-eligibility?courseId=${FELLOWSHIP_ID}`,
      { token: studentToken }
    );
    if (res.status === 500 && String(data.error || "").includes("eligibility")) {
      fail(
        "fellowship_selections table missing — run npm run db:migrate:fellowship-selections or paste Backend/supabase/migrations/20260901_fellowship_selections.sql in Supabase SQL Editor"
      );
    }
    if (!res.ok) fail(data.error || `eligibility ${res.status}`);
    if (data.eligible !== false) fail("expected eligible=false");
    return data.message?.slice(0, 48) + "…";
  });

  await step("Fellowship UTR blocked before selection", async () => {
    const { res, data } = await api("/api/payments/utr-submit", {
      token: studentToken,
      body: {
        courseId: FELLOWSHIP_ID,
        utr: UTR,
        fullName: STUDENT_NAME,
        phone: "9876543210",
        institution: "E2E Test College",
        degree: "B.Tech / B.E.",
        yearOfStudy: "3rd year",
      },
    });
    if (res.status !== 403) fail(`expected 403, got ${res.status}`);
    return String(data.error || "blocked").slice(0, 48) + "…";
  });

  let adminToken = "";
  await step("Admin login", async () => {
    adminToken = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
    return "ok";
  });

  await step("Admin add fellowship selection", async () => {
    const { res, data } = await api("/api/admin/fellowship-selections", {
      token: adminToken,
      body: {
        email: STUDENT_EMAIL,
        fullName: STUDENT_NAME,
        notes: "E2E test",
        sendEmail: false,
      },
    });
    if (!res.ok) fail(data.error || `add selection ${res.status}`);
    if (data.selection?.email?.toLowerCase() !== STUDENT_EMAIL.toLowerCase()) {
      fail("selection email mismatch");
    }
    return data.selection.email;
  });

  await step("Admin lists fellowship selections", async () => {
    const { res, data } = await api("/api/admin/fellowship-selections", {
      token: adminToken,
    });
    if (!res.ok) fail(data.error || `list ${res.status}`);
    const hit = (data.selections || []).find(
      (r: { email: string }) =>
        r.email.toLowerCase() === STUDENT_EMAIL.toLowerCase()
    );
    if (!hit) fail("student not in selection list");
    return `seats ${data.seatCount}/${data.seatCap}`;
  });

  await step("Fellowship eligible after admin selection", async () => {
    const { res, data } = await api(
      `/api/payments/fellowship-eligibility?courseId=${FELLOWSHIP_ID}`,
      { token: studentToken }
    );
    if (!res.ok) fail(data.error || `eligibility ${res.status}`);
    if (data.eligible !== true) fail("expected eligible=true");
    return data.email;
  });

  await step("Fellowship UTR submit after selection", async () => {
    const { res, data } = await api("/api/payments/utr-submit", {
      token: studentToken,
      body: {
        courseId: FELLOWSHIP_ID,
        utr: UTR,
        fullName: STUDENT_NAME,
        phone: "9876543210",
        institution: "E2E Test College",
        degree: "B.Tech / B.E.",
        yearOfStudy: "3rd year",
      },
    });
    if (!res.ok) fail(data.error || `utr-submit ${res.status}`);
    enrollmentId = data.enrollmentId || data.enrollment?.id || null;
    if (!enrollmentId) fail("no enrollmentId");
    return enrollmentId;
  });

  await step("Student sees awaiting verification", async () => {
    const { res, data } = await api("/api/student/me", { token: studentToken });
    if (!res.ok) fail(data.error || `me ${res.status}`);
    const row = (data.enrollments || []).find(
      (e: { id: string }) => e.id === enrollmentId
    );
    if (!row || row.payment_status !== "awaiting_verification") {
      fail(`payment_status=${row?.payment_status}`);
    }
    return row.payment_status;
  });

  await step("Admin revoke fellowship selection", async () => {
    const { res, data } = await api(
      `/api/admin/fellowship-selections/${encodeURIComponent(STUDENT_EMAIL)}`,
      { token: adminToken, method: "DELETE" }
    );
    if (!res.ok) fail(data.error || `revoke ${res.status}`);
    return "revoked";
  });

  await step("Fellowship blocked again after revoke", async () => {
    const { res, data } = await api(
      `/api/payments/fellowship-eligibility?courseId=${FELLOWSHIP_ID}`,
      { token: studentToken }
    );
    if (!res.ok) fail(data.error || `eligibility ${res.status}`);
    if (data.eligible !== false) fail("expected eligible=false after revoke");
    return "blocked";
  });

  console.log("\n── Summary ──");
  for (const r of results) {
    console.log(`  ${r.ok ? "✓" : "✗"} ${r.name} — ${r.detail}`);
  }
  console.log(`\n${results.length}/${results.length} passed\n`);
}

main()
  .catch(async () => {
    console.log("\n── Summary (failed) ──");
    for (const r of results) {
      console.log(`  ${r.ok ? "✓" : "✗"} ${r.name} — ${r.detail || ""}`);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
  });
