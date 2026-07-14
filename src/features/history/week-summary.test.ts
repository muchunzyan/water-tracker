import { addDays, startOfWeek } from 'date-fns';

import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { buildWeekSummary } from './week-summary';

describe('buildWeekSummary', () => {
  it('группирует записи по локальным дням и рассчитывает выполнение цели', () => {
    const weekStart = startOfWeek(new Date(2026, 6, 8), { weekStartsOn: 1 });
    const water = BUILTIN_DRINKS[0]!;
    const consumedAt = addDays(weekStart, 2).toISOString();
    const entry: HydrationEntry = {
      id: 'entry-week',
      drinkId: water.id,
      drink: createDrinkSnapshot(water),
      volumeMl: 1_000,
      effectiveHydrationMl: 1_000,
      consumedAt,
      createdAt: consumedAt,
      updatedAt: consumedAt,
    };

    const summary = buildWeekSummary([entry], weekStart, 2_000);

    expect(summary).toHaveLength(7);
    expect(summary[2]).toMatchObject({
      volumeMl: 1_000,
      effectiveHydrationMl: 1_000,
      progress: 50,
    });
    expect(summary[1]?.progress).toBe(0);
  });

  it('округляет почти выполненную цель вниз', () => {
    const weekStart = startOfWeek(new Date(2026, 6, 8), { weekStartsOn: 1 });
    const water = BUILTIN_DRINKS[0]!;
    const consumedAt = weekStart.toISOString();
    const entry: HydrationEntry = {
      id: 'entry-almost-complete',
      drinkId: water.id,
      drink: createDrinkSnapshot(water),
      volumeMl: 2_190,
      effectiveHydrationMl: 2_190,
      consumedAt,
      createdAt: consumedAt,
      updatedAt: consumedAt,
    };

    expect(buildWeekSummary([entry], weekStart, 2_200)[0]?.progress).toBe(99);
  });
});
