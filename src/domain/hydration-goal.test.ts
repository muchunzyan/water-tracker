import { calculateRecommendedGoalMl } from './hydration-goal';

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
