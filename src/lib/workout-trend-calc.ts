import { computeVolume } from "@/lib/personal-record-calc";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface WorkoutLogInput {
  date: Date;
  exerciseLogs: { sets: number | null; repsPerSet: number | null; weightKg: number | null }[];
}

export interface WeeklyVolumePoint {
  weekLabel: string; // local date key of the week's first day
  totalVolume: number;
  sessionCount: number;
}

/**
 * Buckets workout logs into `weeks` consecutive 7-day windows starting at
 * `start`, same "always the full range" convention as buildDailyMacroTrend -
 * a week with no sessions still gets a zeroed point, so the chart doesn't
 * skip training breaks.
 */
export function buildWeeklyVolumeTrend(logs: WorkoutLogInput[], start: Date, weeks: number): WeeklyVolumePoint[] {
  const points: WeeklyVolumePoint[] = [];

  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const logsInWeek = logs.filter((log) => log.date >= weekStart && log.date < weekEnd);

    let totalVolume = 0;
    for (const log of logsInWeek) {
      for (const exercise of log.exerciseLogs) {
        if (exercise.weightKg && exercise.repsPerSet && exercise.sets) {
          totalVolume += computeVolume(exercise.weightKg, exercise.repsPerSet, exercise.sets);
        }
      }
    }

    points.push({ weekLabel: localDateKey(weekStart), totalVolume, sessionCount: logsInWeek.length });
  }

  return points;
}

export interface RecordProgressionPoint {
  dateLabel: string;
  value: number;
}

/**
 * Filters to one exercise+recordType pair and sorts chronologically - ready
 * to feed a line chart. Unlike the volume trend, PR history isn't bucketed:
 * records land whenever they're set, not on a fixed cadence.
 */
export function buildRecordProgression(
  records: { exerciseName: string; recordType: string; value: number; achievedAt: Date }[],
  exerciseName: string,
  recordType: string,
): RecordProgressionPoint[] {
  return records
    .filter((r) => r.exerciseName === exerciseName && r.recordType === recordType)
    .slice()
    .sort((a, b) => a.achievedAt.getTime() - b.achievedAt.getTime())
    .map((r) => ({ dateLabel: localDateKey(r.achievedAt), value: r.value }));
}
