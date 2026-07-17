import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { sortDrinksByUsage } from './drink-options';

const water = BUILTIN_DRINKS.find((drink) => drink.id === 'builtin-water')!;
const ayran = BUILTIN_DRINKS.find((drink) => drink.id === 'builtin-ayran')!;
const coffee = BUILTIN_DRINKS.find((drink) => drink.id === 'builtin-coffee')!;

function entry(drinkId: string, index: number): HydrationEntry {
  const drink = [water, ayran, coffee].find((item) => item.id === drinkId)!;
  const timestamp = `2026-07-17T10:0${index}:00.000Z`;

  return {
    id: `entry-${index}`,
    drinkId,
    drink: createDrinkSnapshot(drink),
    volumeMl: 250,
    effectiveHydrationMl: Math.round((250 * drink.hydrationPercent) / 100),
    consumedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('sortDrinksByUsage', () => {
  it('сортирует по частоте, затем по русскому алфавиту', () => {
    const result = sortDrinksByUsage(
      [water, coffee, ayran],
      [entry(coffee.id, 1), entry(water.id, 2), entry(coffee.id, 3)],
    );

    expect(result.map((drink) => drink.name)).toEqual([
      'Кофе',
      'Вода',
      'Айран',
    ]);
  });

  it('использует алфавит для напитков с одинаковой частотой', () => {
    const result = sortDrinksByUsage([water, coffee, ayran], []);

    expect(result.map((drink) => drink.name)).toEqual([
      'Айран',
      'Вода',
      'Кофе',
    ]);
  });
});
