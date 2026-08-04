import { describe, it, expect } from "vitest";
import { computeVolume, evaluateRecord } from "@/lib/personal-record-calc";

describe("computeVolume", () => {
  it("multiplies weight by reps per set by sets", () => {
    expect(computeVolume(60, 8, 4)).toBe(1920);
  });

  it("returns 0 when any factor is 0", () => {
    expect(computeVolume(0, 8, 4)).toBe(0);
  });
});

describe("evaluateRecord", () => {
  it("is a new record when there is no prior best", () => {
    expect(evaluateRecord(100, null).isNewRecord).toBe(true);
  });

  it("is a new record when the candidate beats the prior best", () => {
    expect(evaluateRecord(150, 100).isNewRecord).toBe(true);
  });

  it("is not a new record when the candidate ties or falls short", () => {
    expect(evaluateRecord(100, 100).isNewRecord).toBe(false);
    expect(evaluateRecord(80, 100).isNewRecord).toBe(false);
  });
});
