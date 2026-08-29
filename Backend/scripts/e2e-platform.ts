/**
 * Live platform E2E — student + admin happy path against a real API + Supabase.
 *
 * Covers: health → courses → register → login → /me → UTR enroll →
 * admin queue → approve → student sees active enrollment → admin stats.
 *
 * Usage (from Backend/):
 *   npm run test:e2e:platform
 *
 * Env (from Backend/.env):
 *   API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 *
 * Optional:
 *   E2E_COURSE_ID=frameworks-lab
 *   E2E_KEEP_USER=1   (skip deleting the test student)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

type StepResult = { name: string; ok: boolean; detail?: string; ms: number };

const API = (process.env.API_URL || "https://seedqura.onrender.com").replace(
  /\/$/,
  ""
);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const COURSE_ID = process.env.E2E_COURSE_ID || "frameworks-lab";
const KEEP_USER = process.env.E2E_KEEP_USER === "1";

const stamp = Date.now().toString(36);
const STUDENT_EMAIL = `e2e.student.${stamp}@seedqura.test`;
const STUDENT_PASSWORD = `E2eTest!${stamp}Aa1`;
const STUDENT_NAME = `E2E Student ${stamp}`;
const UTR = `E2E${stamp.toUpperCase()}UTR99`.slice(0, 22);

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
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
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
  if (KEEP_USER || !SERVICE_KEY || !studentId) return;
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.from("payments").delete().eq("enrollment_id", enrollmentId || "");
    if (enrollmentId) {
      await admin.from("enrollments").delete().eq("id", enrollmentId);
    }
    await admin.from("enrollments").delete().eq("user_id", studentId);
    await admin.from("notifications").delete().eq("user_id", studentId);
    await admin.from("profiles").delete().eq("id", studentId);
    await admin.auth.admin.deleteUser(studentId);
    console.log(`  · cleaned up test user ${STUDENT_EMAIL}`);
  } catch (err) {
    console.warn(
      "  · cleanup warning:",
      err instanceof Error ? err.message : err
    );
  }
}

async function main() {
  console.log(`\nSeedqura platform E2E → ${API}`);
  console.log(`Course: ${COURSE_ID}`);
  console.log(`Student: ${STUDENT_EMAIL}\n`);

  if (!SUPABASE_URL || !ANON_KEY) {
    fail("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY");
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    fail("Missing ADMIN_EMAIL / ADMIN_PASSWORD");
  }

  await step("API health", async () => {
    const { res, data } = await api("/health", { timeoutMs: 120_000 });
    if (!res.ok || !data.ok) fail(`health ${res.status} ${JSON.stringify(data)}`);
    return `ok redis=${String(data.redis)}`;
  });

  await step("Public courses list", async () => {
    const { res, data } = await api("/api/courses");
    if (!res.ok) fail(`courses ${res.status}`);
    const list = Array.isArray(data.courses) ? data.courses : [];
    if (list.length === 0) fail("No published courses");
    const hit = list.find((c: { id: string }) => c.id === COURSE_ID);
    if (!hit) fail(`Course ${COURSE_ID} not in published list`);
    return `${list.length} courses; ${COURSE_ID}=₹${hit.price_inr}`;
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
    if (!studentId) fail("register succeeded but no userId");
    return studentId;
  });

  let studentToken = "";
  await step("Student login (Supabase JWT)", async () => {
    studentToken = await signIn(STUDENT_EMAIL, STUDENT_PASSWORD);
    return `token ${studentToken.slice(0, 12)}…`;
  });

  await step("Student GET /me", async () => {
    const { res, data } = await api("/api/student/me", { token: studentToken });
    if (!res.ok) fail(data.error || `me ${res.status}`);
    if (data.profile?.email?.toLowerCase() !== STUDENT_EMAIL.toLowerCase()) {
      fail("profile email mismatch");
    }
    if (data.profile?.role !== "student") fail(`role=${data.profile?.role}`);
    return `enrollments=${(data.enrollments || []).length}`;
  });

  await step("Student UTR enroll", async () => {
    const { res, data } = await api("/api/payments/utr-submit", {
      token: studentToken,
      body: {
        courseId: COURSE_ID,
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
    if (!enrollmentId) fail("No enrollmentId returned");
    return enrollmentId;
  });

  await step("Student sees awaiting verification", async () => {
    const { res, data } = await api("/api/student/me", { token: studentToken });
    if (!res.ok) fail(data.error || `me ${res.status}`);
    const row = (data.enrollments || []).find(
      (e: { id: string }) => e.id === enrollmentId
    );
    if (!row) fail("Enrollment missing from /me");
    if (row.payment_status !== "awaiting_verification") {
      fail(`payment_status=${row.payment_status}`);
    }
    return row.payment_status;
  });

  let adminToken = "";
  await step("Admin login", async () => {
    adminToken = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
    return `token ${adminToken.slice(0, 12)}…`;
  });

  await step("Admin stats", async () => {
    const { res, data } = await api("/api/admin/stats", { token: adminToken });
    if (!res.ok) fail(data.error || `stats ${res.status}`);
    return `students=${data.students} courses=${data.courses} enrollments=${data.enrollments}`;
  });

  await step("Admin list courses", async () => {
    const { res, data } = await api("/api/admin/courses", { token: adminToken });
    if (!res.ok) fail(data.error || `admin courses ${res.status}`);
    const list = data.courses || [];
    if (!list.some((c: { id: string }) => c.id === COURSE_ID)) {
      fail(`${COURSE_ID} missing from admin courses`);
    }
    return `${list.length} courses`;
  });

  await step("Admin UTR queue contains enrollment", async () => {
    const { res, data } = await api(
      "/api/admin/enrollments?payment_status=awaiting_verification",
      { token: adminToken }
    );
    if (!res.ok) fail(data.error || `enrollments ${res.status}`);
    const hit = (data.enrollments || []).find(
      (e: { id: string }) => e.id === enrollmentId
    );
    if (!hit) fail("Enrollment not in awaiting_verification queue");
    return hit.id;
  });

  await step("Admin approve enrollment", async () => {
    const { res, data } = await api(`/api/admin/enrollments/${enrollmentId}`, {
      method: "PATCH",
      token: adminToken,
      body: { status: "active" },
    });
    if (!res.ok) fail(data.error || `approve ${res.status}`);
    if (data.enrollment?.status !== "active") {
      fail(`status=${data.enrollment?.status}`);
    }
    if (data.enrollment?.payment_status !== "paid") {
      fail(`payment_status=${data.enrollment?.payment_status}`);
    }
    return "active/paid";
  });

  await step("Student sees active enrollment", async () => {
    const { res, data } = await api("/api/student/me", { token: studentToken });
    if (!res.ok) fail(data.error || `me ${res.status}`);
    const row = (data.enrollments || []).find(
      (e: { id: string }) => e.id === enrollmentId
    );
    if (!row) fail("Enrollment missing");
    if (row.status !== "active" || row.payment_status !== "paid") {
      fail(`status=${row.status} payment=${row.payment_status}`);
    }
    return "active/paid";
  });

  await step("Admin can list students", async () => {
    const { res, data } = await api(
      `/api/admin/students?q=${encodeURIComponent(STUDENT_EMAIL)}`,
      { token: adminToken }
    );
    if (!res.ok) fail(data.error || `students ${res.status}`);
    const hit = (data.students || []).find(
      (s: { id: string; email?: string }) =>
        s.id === studentId ||
        s.email?.toLowerCase() === STUDENT_EMAIL.toLowerCase()
    );
    if (!hit) fail("Test student not found in admin students");
    return hit.id;
  });

  await step("Student cannot access admin", async () => {
    const { res, data } = await api("/api/admin/stats", { token: studentToken });
    if (res.status !== 403) {
      fail(`expected 403, got ${res.status} ${JSON.stringify(data)}`);
    }
    return "403 Admin only";
  });

  console.log("\nAll platform E2E steps passed.\n");
}

main()
  .catch((err) => {
    console.error("\nPlatform E2E FAILED:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    const passed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    console.log(`Summary: ${passed} passed, ${failed} failed (${results.length} steps)`);
    for (const r of results) {
      console.log(
        `  ${r.ok ? "PASS" : "FAIL"}  ${r.name}  ${r.ms}ms${r.detail ? ` — ${r.detail}` : ""}`
      );
    }
    console.log("");
  });
