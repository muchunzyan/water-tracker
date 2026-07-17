import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { getEntryDefaults, getQuickVolumes } from './volume-suggestions';

const water = BUILTIN_DRINKS[0]!;
const tea = BUILTIN_DRINKS[1]!;

function entry(id: string, volumeMl: number, drink = water): HydrationEntry {
  const timestamp = `2026-07-14T10:0${id}:00.000Z`;
  return {
    id,
    drinkId: drink.id,
    drink: createDrinkSnapshot(drink),
    volumeMl,
    effectiveHydrationMl: Math.round((volumeMl * drink.hydrationPercent) / 100),
    consumedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('volume suggestions', () => {
  it('показывает самые частые объёмы и дополняет набор', () => {
    expect(
      getQuickVolumes([entry('1', 275), entry('2', 275), entry('3', 450)]),
    ).toEqual([275, 450, 200, 250]);
  });

  it('при равной частоте ставит выше недавно использованный объём', () => {
    expect(getQuickVolumes([entry('1', 275), entry('3', 450)])).toEqual([
      450, 275, 200, 250,
    ]);
  });

  it('подставляет напиток и объём из самой поздней записи', () => {
    const entries = [entry('1', 330), entry('9', 280, tea)];

    expect(getEntryDefaults(entries, [water, tea])).toEqual({
      drinkId: tea.id,
      volumeMl: 280,
    });
  });

  it('сохраняет объём удалённого напитка и выбирает воду', () => {
    expect(getEntryDefaults([entry('9', 280, tea)], [water])).toEqual({
      drinkId: water.id,
      volumeMl: 280,
    });
  });

  it('использует воду и начальный объём без истории', () => {
    expect(getEntryDefaults([], [tea, water])).toEqual({
      drinkId: water.id,
      volumeMl: 250,
    });
  });
});
