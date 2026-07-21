import type { ActivityLevel, Settings } from './models';

export const TRAINING_ML_PER_HOUR = 600;
export const HEAT_THRESHOLD_C = 25;
export const HEAT_ML_PER_DEGREE = 100;

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

export function calculateDailyGoalMl(settings: Settings, date = new Date()) {
  const dateKey = getLocalDateKey(date);
  const trainingHours =
    settings.training?.date === dateKey ? settings.training.hours : 0;
  const maxTemperatureC =
    settings.useTemperatureAdjustment && settings.weather?.date === dateKey
      ? settings.weather.maxTemperatureC
      : null;
  const trainingAdjustmentMl = trainingHours * TRAINING_ML_PER_HOUR;
  const temperatureAdjustmentMl =
    maxTemperatureC === null
      ? 0
      : Math.max(0, maxTemperatureC - HEAT_THRESHOLD_C) * HEAT_ML_PER_DEGREE;

  return Math.min(
    10_000,
    Math.max(
      250,
      Math.round(
        settings.dailyGoalMl + trainingAdjustmentMl + temperatureAdjustmentMl,
      ),
    ),
  );
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
