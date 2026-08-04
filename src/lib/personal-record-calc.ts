/**
 * Ports the dual PersonalRecord write-path logic from HabitForge's
 * workouts/router.py: auto-detection on exercise-log create (computed
 * "max_volume" = weight * reps * sets) and manual entry (any recordType,
 * compared against the prior best of the same type).
 */

export function computeVolume(weightKg: number, repsPerSet: number, sets: number): number {
  return weightKg * repsPerSet * sets;
}

export interface EvaluateRecordResult {
  isNewRecord: boolean;
}

export function evaluateRecord(
  candidateValue: number,
  priorBestValue: number | null,
): EvaluateRecordResult {
  return { isNewRecord: priorBestValue === null || candidateValue > priorBestValue };
}
