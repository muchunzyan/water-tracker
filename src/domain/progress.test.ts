import { calculateProgressPercent, calculateRemainingMl } from './progress';

describe('hydration progress', () => {
  it('не показывает отрицательный прогресс', () => {
    expect(calculateProgressPercent(-159, 2_000)).toBe(0);
  });
  it('округляет процент вниз до фактического достижения цели', () => {
    expect(calculateProgressPercent(2_190, 2_200)).toBe(99);
    expect(calculateProgressPercent(2_200, 2_200)).toBe(100);
  });

  it('не возвращает отрицательный остаток', () => {
    expect(calculateRemainingMl(1_970, 2_200)).toBe(230);
    expect(calculateRemainingMl(2_300, 2_200)).toBe(0);
  });
});
