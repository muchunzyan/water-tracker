import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { getDefaultVolume, getQuickVolumes } from './volume-suggestions';

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
  it('показывает последние уникальные объёмы и дополняет набор', () => {
    expect(
      getQuickVolumes([entry('1', 275), entry('2', 275), entry('3', 450)]),
    ).toEqual([275, 450, 200, 250]);
  });

  it('предпочитает последний объём выбранного напитка', () => {
    const entries = [entry('1', 330), entry('2', 280, tea)];

    expect(getDefaultVolume(entries, tea)).toBe(280);
    expect(getDefaultVolume(entries, water)).toBe(330);
  });

  it('использует последнюю запись, а затем стандартную порцию', () => {
    expect(getDefaultVolume([entry('1', 330)], tea)).toBe(330);
    expect(getDefaultVolume([], tea)).toBe(250);
  });
});
