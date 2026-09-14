import { describe, it, expect } from "vitest";
import { buildWeeklyVolumeTrend, buildRecordProgression } from "./workout-trend-calc";

describe("buildWeeklyVolumeTrend", () => {
  it("returns a zeroed point per week when there are no logs", () => {
    const points = buildWeeklyVolumeTrend([], new Date(2026, 8, 1), 3);
    expect(points).toHaveLength(3);
    expect(points.every((p) => p.totalVolume === 0 && p.sessionCount === 0)).toBe(true);
  });

  it("sums volume across exercises and sessions within the same week", () => {
    const points = buildWeeklyVolumeTrend(
      [
        {
          date: new Date(2026, 8, 2),
          exerciseLogs: [
            { weightKg: 100, repsPerSet: 5, sets: 3 }, // 1500
            { weightKg: 50, repsPerSet: 10, sets: 4 }, // 2000
          ],
        },
        {
          date: new Date(2026, 8, 4),
          exerciseLogs: [{ weightKg: 20, repsPerSet: 12, sets: 3 }], // 720
        },
      ],
      new Date(2026, 8, 1),
      1,
    );

    expect(points[0]).toEqual({ weekLabel: "2026-09-01", totalVolume: 4220, sessionCount: 2 });
  });

  it("ignores exercise logs missing weight/reps/sets", () => {
    const points = buildWeeklyVolumeTrend(
      [{ date: new Date(2026, 8, 2), exerciseLogs: [{ weightKg: null, repsPerSet: 10, sets: 3 }] }],
      new Date(2026, 8, 1),
      1,
    );
    expect(points[0].totalVolume).toBe(0);
    expect(points[0].sessionCount).toBe(1);
  });

  it("places a session in the correct week when spanning multiple weeks", () => {
    const points = buildWeeklyVolumeTrend(
      [{ date: new Date(2026, 8, 9), exerciseLogs: [{ weightKg: 10, repsPerSet: 10, sets: 1 }] }],
      new Date(2026, 8, 1),
      2,
    );
    expect(points[0].sessionCount).toBe(0);
    expect(points[1].sessionCount).toBe(1);
    expect(points[1].totalVolume).toBe(100);
  });
});

describe("buildRecordProgression", () => {
  const records = [
    { exerciseName: "Жим лёжа", recordType: "max_weight", value: 80, achievedAt: new Date(2026, 6, 1) },
    { exerciseName: "Жим лёжа", recordType: "max_weight", value: 90, achievedAt: new Date(2026, 5, 1) },
    { exerciseName: "Жим лёжа", recordType: "max_reps", value: 15, achievedAt: new Date(2026, 6, 1) },
    { exerciseName: "Присед", recordType: "max_weight", value: 120, achievedAt: new Date(2026, 6, 1) },
  ];

  it("filters to the requested exercise and record type, sorted chronologically", () => {
    const points = buildRecordProgression(records, "Жим лёжа", "max_weight");
    expect(points).toEqual([
      { dateLabel: "2026-06-01", value: 90 },
      { dateLabel: "2026-07-01", value: 80 },
    ]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(buildRecordProgression(records, "Тяга", "max_weight")).toEqual([]);
  });
});
