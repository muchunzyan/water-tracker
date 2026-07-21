import {
  calculateDailyGoalMl,
  calculateRecommendedGoalMl,
} from './hydration-goal';
import type { Settings } from './models';

describe('calculateRecommendedGoalMl', () => {
  it('учитывает рост, вес и активность и округляет до 50 мл', () => {
    expect(
      calculateRecommendedGoalMl({
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'low',
      }),
    ).toBe(2_200);
    expect(
      calculateRecommendedGoalMl({
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'high',
      }),
    ).toBe(2_900);
  });
});

describe('calculateDailyGoalMl', () => {
  const settings: Settings = {
    version: 1,
    dailyGoalMl: 2_200,
    theme: 'system',
    onboardingCompleted: true,
    useTemperatureAdjustment: true,
    hydrationProfile: {
      heightCm: 170,
      weightKg: 70,
      activityLevel: 'moderate',
    },
    training: { date: '2026-07-21', hours: 1.25 },
    weather: {
      date: '2026-07-21',
      maxTemperatureC: 29.5,
      latitude: 55.75,
      longitude: 37.62,
      fetchedAt: '2026-07-21T06:00:00.000Z',
    },
  };

  it('добавляет тренировку и 100 мл за каждый градус выше 25 °C', () => {
    expect(calculateDailyGoalMl(settings, new Date(2026, 6, 21))).toBe(3_400);
  });

  it('не использует данные за другой день', () => {
    expect(calculateDailyGoalMl(settings, new Date(2026, 6, 22))).toBe(2_200);
  });

  it('не применяет погоду, если пользователь отключил её', () => {
    expect(
      calculateDailyGoalMl(
        { ...settings, useTemperatureAdjustment: false },
        new Date(2026, 6, 21),
      ),
    ).toBe(2_950);
  });
});
