import type { HydrationEntry } from '../../domain/models';

export function calculateHydrationStreak(
  entries: readonly HydrationEntry[],
  goalMl: number,
  now = new Date(),
) {
  if (goalMl <= 0) return 0;

  const hydrationByDay = new Map<string, number>();
  for (const entry of entries) {
    const date = new Date(entry.consumedAt);
    if (Number.isNaN(date.getTime()) || date > now) continue;
    const key = localDayKey(date);
    hydrationByDay.set(
      key,
      (hydrationByDay.get(key) ?? 0) + entry.effectiveHydrationMl,
    );
  }

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if ((hydrationByDay.get(localDayKey(cursor)) ?? 0) < goalMl) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while ((hydrationByDay.get(localDayKey(cursor)) ?? 0) >= goalMl) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function formatHydrationStreak(days: number) {
  const absoluteDays = Math.abs(days);
  const lastTwoDigits = absoluteDays % 100;
  const lastDigit = absoluteDays % 10;
  const suffix =
    lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? 'дней'
      : lastDigit === 1
        ? 'день'
        : lastDigit >= 2 && lastDigit <= 4
          ? 'дня'
          : 'дней';
  return `${days} ${suffix}`;
}

function localDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
