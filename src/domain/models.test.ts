import { BUILTIN_DRINKS } from './builtin-drinks';
import {
  backupSchema,
  calculateEffectiveHydrationMl,
  createDrinkSnapshot,
  drinkSchema,
  hydrationEntrySchema,
  settingsSchema,
} from './models';

describe('calculateEffectiveHydrationMl', () => {
  it('рассчитывает эффективную гидратацию и округляет до миллилитра', () => {
    expect(calculateEffectiveHydrationMl(300, 80)).toBe(240);
    expect(calculateEffectiveHydrationMl(333, 95)).toBe(316);
  });
});

describe('domain schemas', () => {
  const water = BUILTIN_DRINKS[0]!;

  it('валидирует все встроенные напитки', () => {
    expect(
      BUILTIN_DRINKS.every((drink) => drinkSchema.safeParse(drink).success),
    ).toBe(true);
  });

  it('отклоняет запись с неверно рассчитанной гидратацией', () => {
    const result = hydrationEntrySchema.safeParse({
      id: 'entry-1',
      drinkId: water.id,
      drink: createDrinkSnapshot(water),
      volumeMl: 300,
      effectiveHydrationMl: 299,
      consumedAt: '2026-07-11T12:00:00.000+03:00',
      createdAt: '2026-07-11T12:00:00.000+03:00',
      updatedAt: '2026-07-11T12:00:00.000+03:00',
    });

    expect(result.success).toBe(false);
  });

  it('валидирует настройки и версионированную резервную копию', () => {
    const settings = settingsSchema.parse({
      version: 1,
      dailyGoalMl: 2_000,
      theme: 'system',
    });

    expect(
      backupSchema.safeParse({
        version: 1,
        exportedAt: '2026-07-11T12:00:00.000Z',
        drinks: BUILTIN_DRINKS,
        entries: [],
        settings,
      }).success,
    ).toBe(true);
  });
});
