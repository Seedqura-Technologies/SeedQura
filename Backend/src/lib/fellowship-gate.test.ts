import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RESEARCH_FELLOWSHIP_ID,
  checkFellowshipPayment,
} from "./fellowship-gate.js";

describe("checkFellowshipPayment", () => {
  it("allows non-fellowship courses", () => {
    assert.deepEqual(
      checkFellowshipPayment("frameworks-lab", "any@x.com", new Set()),
      { blocked: false }
    );
  });

  it("blocks when allow-list is empty", () => {
    const result = checkFellowshipPayment(
      RESEARCH_FELLOWSHIP_ID,
      "student@example.com",
      new Set()
    );
    assert.equal(result.blocked, true);
    if (result.blocked) {
      assert.match(result.message, /selection/i);
    }
  });

  it("blocks when email is not on allow-list", () => {
    const result = checkFellowshipPayment(
      RESEARCH_FELLOWSHIP_ID,
      "other@example.com",
      new Set(["selected@example.com"])
    );
    assert.equal(result.blocked, true);
  });

  it("allows when email matches allow-list (case-insensitive)", () => {
    assert.deepEqual(
      checkFellowshipPayment(
        RESEARCH_FELLOWSHIP_ID,
        "selected@example.com",
        new Set(["selected@example.com"])
      ),
      { blocked: false }
    );
  });
});
