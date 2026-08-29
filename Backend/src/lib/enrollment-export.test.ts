import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  enrollmentsToCsv,
  exportFilename,
  filterEnrollmentsByDateRange,
  toEnrollmentExportRow,
} from "./enrollment-export.js";

describe("toEnrollmentExportRow", () => {
  it("maps applicant + course + profile fields", () => {
    const row = toEnrollmentExportRow({
      id: "e1",
      status: "active",
      payment_status: "paid",
      progress_pct: 10,
      created_at: "2026-08-01T10:00:00.000Z",
      utr: "UTR123",
      institution: "IIT",
      degree: "B.Tech",
      year_of_study: "3rd year",
      applicant_phone: "9876543210",
      applicant_name: "Ada",
      utr_submitted_at: "2026-08-02T10:00:00.000Z",
      course_id: "frameworks-lab",
      course: { id: "frameworks-lab", name: "Frameworks Lab" },
      profile: { full_name: "Ada Lovelace", email: "ada@example.com" },
    });
    assert.equal(row.student_name, "Ada");
    assert.equal(row.email, "ada@example.com");
    assert.equal(row.course_name, "Frameworks Lab");
    assert.equal(row.utr, "UTR123");
  });

  it("falls back to profile name when applicant_name missing", () => {
    const row = toEnrollmentExportRow({
      id: "e2",
      status: "active",
      payment_status: "paid",
      profile: { full_name: "Grace Hopper", email: "grace@example.com" },
      course: { id: "signal-lab", name: "Signal Lab" },
    });
    assert.equal(row.student_name, "Grace Hopper");
  });
});

describe("enrollmentsToCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = enrollmentsToCsv([
      {
        id: "e1",
        status: "active",
        payment_status: "paid",
        applicant_name: 'Ada, "the Countess"',
        institution: "College, Inc",
        course: { id: "c1", name: "Course A" },
        profile: { email: "a@b.com" },
      },
    ]);
    assert.match(csv, /enrollment_id,student_name/);
    assert.match(csv, /"Ada, ""the Countess"""/);
    assert.match(csv, /"College, Inc"/);
  });
});

describe("filterEnrollmentsByDateRange", () => {
  const rows = [
    { id: "a", created_at: "2026-08-01T12:00:00.000Z" },
    { id: "b", created_at: "2026-08-15T12:00:00.000Z" },
    { id: "c", created_at: "2026-09-01T12:00:00.000Z" },
  ];

  it("filters inclusive date range", () => {
    const filtered = filterEnrollmentsByDateRange(rows, {
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
    });
    assert.deepEqual(
      filtered.map((r) => r.id),
      ["a", "b"]
    );
  });
});

describe("exportFilename", () => {
  it("includes course and date markers", () => {
    const name = exportFilename({
      courseId: "frameworks-lab",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
    });
    assert.match(name, /frameworks-lab/);
    assert.match(name, /enrolled-2026-08-01-to-2026-08-31/);
    assert.match(name, /\.csv$/);
  });
});
