import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  selectActiveCourseStudents,
  toActiveCourseStudent,
  type EnrollmentNotifyRow,
} from "./course-students.js";

function row(
  overrides: Partial<EnrollmentNotifyRow> & {
    profile?: EnrollmentNotifyRow["profile"];
  } = {}
): EnrollmentNotifyRow {
  return {
    id: overrides.id ?? "enr-1",
    user_id: overrides.user_id ?? "user-1",
    status: overrides.status ?? "active",
    payment_status: overrides.payment_status ?? "paid",
    profile:
      overrides.profile === undefined
        ? {
            id: "user-1",
            full_name: "Ada Lovelace",
            email: "ada@example.com",
            status: "active",
          }
        : overrides.profile,
  };
}

describe("toActiveCourseStudent", () => {
  it("includes active + paid enrollment with valid profile email", () => {
    const student = toActiveCourseStudent(row());
    assert.deepEqual(student, {
      userId: "user-1",
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      enrollmentId: "enr-1",
    });
  });

  it("excludes rejected enrollments", () => {
    assert.equal(
      toActiveCourseStudent(row({ status: "rejected" })),
      null
    );
  });

  it("excludes refunded enrollments", () => {
    assert.equal(
      toActiveCourseStudent(row({ status: "refunded" })),
      null
    );
  });

  it("excludes pending_payment enrollments", () => {
    assert.equal(
      toActiveCourseStudent(row({ status: "pending_payment" })),
      null
    );
  });

  it("excludes inactive-style statuses that are not active", () => {
    assert.equal(
      toActiveCourseStudent(row({ status: "inactive" })),
      null
    );
  });

  it("excludes unpaid payment_status even if enrollment is active", () => {
    assert.equal(
      toActiveCourseStudent(row({ payment_status: "pending" })),
      null
    );
    assert.equal(
      toActiveCourseStudent(row({ payment_status: "failed" })),
      null
    );
  });

  it("excludes refunded payment_status", () => {
    assert.equal(
      toActiveCourseStudent(row({ payment_status: "refunded" })),
      null
    );
  });

  it("excludes suspended profiles", () => {
    assert.equal(
      toActiveCourseStudent(
        row({
          profile: {
            id: "user-1",
            full_name: "Ada",
            email: "ada@example.com",
            status: "suspended",
          },
        })
      ),
      null
    );
  });

  it("excludes missing or invalid email", () => {
    assert.equal(
      toActiveCourseStudent(
        row({
          profile: {
            id: "user-1",
            full_name: "Ada",
            email: null,
            status: "active",
          },
        })
      ),
      null
    );
    assert.equal(
      toActiveCourseStudent(
        row({
          profile: {
            id: "user-1",
            full_name: "Ada",
            email: "   ",
            status: "active",
          },
        })
      ),
      null
    );
    assert.equal(
      toActiveCourseStudent(
        row({
          profile: {
            id: "user-1",
            full_name: "Ada",
            email: "not-an-email",
            status: "active",
          },
        })
      ),
      null
    );
  });

  it("excludes missing profile join", () => {
    assert.equal(toActiveCourseStudent(row({ profile: null })), null);
  });

  it("unwraps array-shaped profile joins", () => {
    const student = toActiveCourseStudent(
      row({
        profile: [
          {
            id: "user-1",
            full_name: "Ada Lovelace",
            email: "ada@example.com",
            status: "active",
          },
        ],
      })
    );
    assert.equal(student?.email, "ada@example.com");
  });
});

describe("selectActiveCourseStudents", () => {
  it("keeps only eligible rows across mixed enrollment states", () => {
    const students = selectActiveCourseStudents([
      row({
        id: "ok",
        user_id: "u1",
        status: "active",
        payment_status: "paid",
        profile: {
          id: "u1",
          full_name: "Ada Lovelace",
          email: "ada@example.com",
          status: "active",
        },
      }),
      row({
        id: "rej",
        user_id: "u2",
        status: "rejected",
        payment_status: "paid",
        profile: {
          id: "u2",
          full_name: "Bob",
          email: "bob@example.com",
          status: "active",
        },
      }),
      row({
        id: "ref",
        user_id: "u3",
        status: "refunded",
        payment_status: "refunded",
        profile: {
          id: "u3",
          full_name: "Cara",
          email: "cara@example.com",
          status: "active",
        },
      }),
      row({
        id: "pend",
        user_id: "u4",
        status: "pending_payment",
        payment_status: "pending",
        profile: {
          id: "u4",
          full_name: "Dan",
          email: "dan@example.com",
          status: "active",
        },
      }),
      row({
        id: "sus",
        user_id: "u5",
        status: "active",
        payment_status: "paid",
        profile: {
          id: "u5",
          full_name: "Eve",
          email: "eve@example.com",
          status: "suspended",
        },
      }),
    ]);

    assert.equal(students.length, 1);
    assert.equal(students[0]?.enrollmentId, "ok");
    assert.equal(students[0]?.userId, "u1");
  });

  it("dedupes by userId if duplicate rows appear", () => {
    const students = selectActiveCourseStudents([
      row({ id: "enr-a", user_id: "user-1" }),
      row({ id: "enr-b", user_id: "user-1" }),
    ]);
    assert.equal(students.length, 1);
    assert.equal(students[0]?.enrollmentId, "enr-a");
  });
});
