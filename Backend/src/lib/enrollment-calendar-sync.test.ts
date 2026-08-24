import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveEnrollmentCalendarDirection } from "./enrollment-calendar-sync.js";

describe("resolveEnrollmentCalendarDirection", () => {
  it("adds when enrollment is active and paid", () => {
    assert.equal(
      resolveEnrollmentCalendarDirection({
        status: "active",
        payment_status: "paid",
      }),
      "add"
    );
  });

  it("removes when enrollment is rejected", () => {
    assert.equal(
      resolveEnrollmentCalendarDirection({
        status: "rejected",
        payment_status: "paid",
      }),
      "remove"
    );
  });

  it("removes when enrollment is refunded", () => {
    assert.equal(
      resolveEnrollmentCalendarDirection({
        status: "refunded",
        payment_status: "paid",
      }),
      "remove"
    );
  });

  it("removes when payment_status is refunded", () => {
    assert.equal(
      resolveEnrollmentCalendarDirection({
        status: "active",
        payment_status: "refunded",
      }),
      "remove"
    );
  });

  it("does nothing for pending payment", () => {
    assert.equal(
      resolveEnrollmentCalendarDirection({
        status: "pending_payment",
        payment_status: "pending",
      }),
      "none"
    );
  });

  it("does nothing for failed payment on pending enrollment", () => {
    assert.equal(
      resolveEnrollmentCalendarDirection({
        status: "pending_payment",
        payment_status: "failed",
      }),
      "none"
    );
  });
});
