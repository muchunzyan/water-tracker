import { addDays, isSameDay, startOfDay } from 'date-fns';

import type { HydrationEntry } from '../../domain/models';

export interface DaySummary {
  date: Date;
  effectiveHydrationMl: number;
  progress: number;
  volumeMl: number;
}

export function buildWeekSummary(
  entries: readonly HydrationEntry[],
  weekStart: Date,
  dailyGoalMl: number,
): DaySummary[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startOfDay(weekStart), index);
    const dayEntries = entries.filter((entry) =>
      isSameDay(new Date(entry.consumedAt), date),
    );
    const effectiveHydrationMl = dayEntries.reduce(
      (sum, entry) => sum + entry.effectiveHydrationMl,
      0,
    );

    return {
      date,
      effectiveHydrationMl,
      progress: Math.round((effectiveHydrationMl / dailyGoalMl) * 100),
      volumeMl: dayEntries.reduce((sum, entry) => sum + entry.volumeMl, 0),
    };
  });
}
