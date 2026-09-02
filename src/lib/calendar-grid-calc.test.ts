import { describe, it, expect } from "vitest";
import { getMonthGridDays } from "./calendar-grid-calc";

describe("getMonthGridDays", () => {
  it("adds no leading padding when the month starts on weekStartsOn", () => {
    // 2026-06-01 is a Monday
    const days = getMonthGridDays(2026, 6, 1);
    expect(days[0].date).toEqual(new Date(2026, 5, 1));
    expect(days[0].isCurrentMonth).toBe(true);
  });

  it("adds correct leading padding for a month starting mid-week", () => {
    // 2026-11-01 is a Sunday; weekStartsOn=1 (Monday) needs 6 leading days
    const days = getMonthGridDays(2026, 11, 1);
    expect(days[0].date).toEqual(new Date(2026, 9, 26)); // Oct 26
    expect(days[0].isCurrentMonth).toBe(false);
    expect(days[6].date).toEqual(new Date(2026, 10, 1));
    expect(days[6].isCurrentMonth).toBe(true);
  });

  it("covers every weekday as a possible month start (0-6 offset)", () => {
    for (let month = 1; month <= 12; month++) {
      const days = getMonthGridDays(2026, month, 1);
      const firstCurrentIndex = days.findIndex((d) => d.isCurrentMonth);
      expect(firstCurrentIndex).toBeGreaterThanOrEqual(0);
      expect(firstCurrentIndex).toBeLessThan(7);
      expect(days[firstCurrentIndex].date.getDate()).toBe(1);
    }
  });

  it("produces every row as a complete week (length is a multiple of 7)", () => {
    for (let month = 1; month <= 12; month++) {
      const days = getMonthGridDays(2026, month, 1);
      expect(days.length % 7).toBe(0);
    }
  });

  it("handles a non-leap February correctly (28 days)", () => {
    const days = getMonthGridDays(2026, 2, 1);
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(28);
  });

  it("handles a leap February correctly (29 days)", () => {
    const days = getMonthGridDays(2024, 2, 1);
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(29);
  });

  it("omits trailing padding when the month ends exactly on a week boundary", () => {
    // Confirm at least one real month/weekStartsOn combination needs zero trailing padding
    const allNoTrailingNeeded = Array.from({ length: 12 }, (_, i) => i + 1).some((month) => {
      const days = getMonthGridDays(2026, month, 1);
      const lastCurrentIndex = days.map((d) => d.isCurrentMonth).lastIndexOf(true);
      return lastCurrentIndex === days.length - 1;
    });
    expect(allNoTrailingNeeded).toBe(true);
  });

  it("supports weekStartsOn=0 (Sunday) with different leading padding than weekStartsOn=1", () => {
    const mondayStart = getMonthGridDays(2026, 11, 1);
    const sundayStart = getMonthGridDays(2026, 11, 0);
    expect(mondayStart.length).not.toBe(0);
    expect(sundayStart[0].date).not.toEqual(mondayStart[0].date);
  });
});
