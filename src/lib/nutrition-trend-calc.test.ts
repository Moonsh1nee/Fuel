import { describe, it, expect } from "vitest";
import { buildDailyMacroTrend } from "./nutrition-trend-calc";

describe("buildDailyMacroTrend", () => {
  it("returns one zeroed point per day for an empty entry list", () => {
    const points = buildDailyMacroTrend([], new Date(2026, 8, 1), 5);
    expect(points).toHaveLength(5);
    expect(points.every((p) => p.calories === 0 && p.protein === 0 && p.carbs === 0 && p.fat === 0)).toBe(
      true,
    );
    expect(points.map((p) => p.dateLabel)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
    ]);
  });

  it("sums multiple entries logged on the same day into one point", () => {
    const points = buildDailyMacroTrend(
      [
        { date: new Date(2026, 8, 2, 8, 0), calories: 300, protein: 20, carbs: 30, fat: 10 },
        { date: new Date(2026, 8, 2, 19, 0), calories: 500, protein: 40, carbs: 50, fat: 15 },
      ],
      new Date(2026, 8, 1),
      3,
    );

    expect(points[0]).toMatchObject({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    expect(points[1]).toMatchObject({ calories: 800, protein: 60, carbs: 80, fat: 25 });
    expect(points[2]).toMatchObject({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("ignores entries outside the [start, start+days) range", () => {
    const points = buildDailyMacroTrend(
      [
        { date: new Date(2026, 7, 31), calories: 999, protein: 0, carbs: 0, fat: 0 },
        { date: new Date(2026, 8, 5), calories: 999, protein: 0, carbs: 0, fat: 0 },
      ],
      new Date(2026, 8, 1),
      3,
    );

    expect(points.reduce((sum, p) => sum + p.calories, 0)).toBe(0);
  });

  it("treats null macro fields as zero, same as computeMacroSummary", () => {
    const points = buildDailyMacroTrend(
      [{ date: new Date(2026, 8, 1), calories: 200, protein: null, carbs: null, fat: null }],
      new Date(2026, 8, 1),
      1,
    );
    expect(points[0]).toEqual({ dateLabel: "2026-09-01", calories: 200, protein: 0, carbs: 0, fat: 0 });
  });
});
