import type { Drink } from '../../domain/models';

export function filterDrinks(drinks: readonly Drink[], query: string) {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) return [...drinks];

  return drinks.filter((drink) =>
    normalizeSearchText(drink.name).includes(normalizedQuery),
  );
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .normalize('NFKC');
}
