import type { Drink, HydrationEntry } from '../../domain/models';

const russianCollator = new Intl.Collator('ru-RU', {
  sensitivity: 'base',
  usage: 'sort',
});

/**
 * Часто используемые напитки идут первыми. Напитки с одинаковой частотой
 * располагаются по русскому алфавиту, поэтому порядок всегда предсказуем.
 */
export function sortDrinksByUsage(
  drinks: readonly Drink[],
  entries: readonly HydrationEntry[],
) {
  const usageCount = new Map<string, number>();

  for (const entry of entries) {
    usageCount.set(entry.drinkId, (usageCount.get(entry.drinkId) ?? 0) + 1);
  }

  return [...drinks].sort((left, right) => {
    const frequencyDifference =
      (usageCount.get(right.id) ?? 0) - (usageCount.get(left.id) ?? 0);

    return (
      frequencyDifference || russianCollator.compare(left.name, right.name)
    );
  });
}
