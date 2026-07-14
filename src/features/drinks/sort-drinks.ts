import type { Drink } from '../../domain/models';

export type SortMode =
  'name-asc' | 'name-desc' | 'hydration-desc' | 'hydration-asc';

export const SORT_STORAGE_KEY = 'water-tracker-drink-sort';
export const SORT_MODES: readonly SortMode[] = [
  'name-asc',
  'name-desc',
  'hydration-desc',
  'hydration-asc',
];

export function sortDrinks(drinks: readonly Drink[], mode: SortMode) {
  const collator = new Intl.Collator('ru-RU', { sensitivity: 'base' });

  return [...drinks].sort((left, right) => {
    if (mode === 'name-asc') return collator.compare(left.name, right.name);
    if (mode === 'name-desc') return collator.compare(right.name, left.name);

    const hydrationDifference =
      mode === 'hydration-desc'
        ? right.hydrationPercent - left.hydrationPercent
        : left.hydrationPercent - right.hydrationPercent;

    return hydrationDifference || collator.compare(left.name, right.name);
  });
}
