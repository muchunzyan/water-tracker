import type { ActivityLevel } from './models';

const ACTIVITY_BONUS_ML: Record<ActivityLevel, number> = {
  low: 0,
  moderate: 350,
  high: 700,
};

export function calculateRecommendedGoalMl({
  activityLevel,
  heightCm,
  weightKg,
}: {
  activityLevel: ActivityLevel;
  heightCm: number;
  weightKg: number;
}) {
  const bodySurfaceArea = Math.sqrt((heightCm * weightKg) / 3_600);
  const baselineMl = bodySurfaceArea * 1_200;
  const estimate = baselineMl + ACTIVITY_BONUS_ML[activityLevel];

  return Math.min(5_000, Math.max(1_000, Math.round(estimate / 50) * 50));
}
