import { getLocalDayRange } from './date-range';

describe('getLocalDayRange', () => {
  it('возвращает полуоткрытый диапазон одного локального календарного дня', () => {
    const range = getLocalDayRange(new Date(2026, 6, 11, 15, 30));
    const start = new Date(range.startInclusive);
    const end = new Date(range.endExclusive);

    expect(start.getHours()).toBe(0);
    expect(start.getDate()).toBe(11);
    expect(end.getHours()).toBe(0);
    expect(end.getDate()).toBe(12);
  });
});
