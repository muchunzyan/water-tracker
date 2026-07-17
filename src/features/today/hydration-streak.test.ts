import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import {
  calculateHydrationStreak,
  formatHydrationStreak,
} from './hydration-streak';

const water = BUILTIN_DRINKS[0]!;

function entry(
  id: string,
  date: Date,
  effectiveHydrationMl = 2_000,
): HydrationEntry {
  return {
    id,
    drinkId: water.id,
    drink: createDrinkSnapshot(water),
    volumeMl: effectiveHydrationMl,
    effectiveHydrationMl,
    consumedAt: date.toISOString(),
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
  };
}

describe('hydration streak', () => {
  it('включает сегодняшний день, когда цель выполнена', () => {
    const now = new Date(2026, 6, 17, 14);
    const yesterday = new Date(2026, 6, 16, 12);

    expect(
      calculateHydrationStreak(
        [entry('today', now), entry('yesterday', yesterday)],
        2_000,
        now,
      ),
    ).toBe(2);
  });

  it('не прерывает серию незавершённым сегодняшним днём', () => {
    const now = new Date(2026, 6, 17, 14);
    const yesterday = new Date(2026, 6, 16, 12);
    const beforeYesterday = new Date(2026, 6, 15, 12);

    expect(
      calculateHydrationStreak(
        [
          entry('today', now, 500),
          entry('yesterday', yesterday),
          entry('before-yesterday', beforeYesterday),
        ],
        2_000,
        now,
      ),
    ).toBe(2);
  });

  it('останавливается на пропущенном дне через границу месяца', () => {
    const now = new Date(2026, 7, 1, 10);

    expect(
      calculateHydrationStreak(
        [
          entry('july-31', new Date(2026, 6, 31, 12)),
          entry('july-29', new Date(2026, 6, 29, 12)),
        ],
        2_000,
        now,
      ),
    ).toBe(1);
  });

  it('склоняет подпись серии', () => {
    expect(formatHydrationStreak(1)).toBe('1 день');
    expect(formatHydrationStreak(2)).toBe('2 дня');
    expect(formatHydrationStreak(5)).toBe('5 дней');
    expect(formatHydrationStreak(21)).toBe('21 день');
  });
});
