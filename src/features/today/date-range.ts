import { addDays, startOfDay } from 'date-fns';

export function getLocalDayRange(date: Date) {
  const start = startOfDay(date);

  return {
    startInclusive: start.toISOString(),
    endExclusive: addDays(start, 1).toISOString(),
  };
}
