import 'fake-indexeddb/auto';

import { BUILTIN_DRINKS } from '../domain/builtin-drinks';
import {
  calculateEffectiveHydrationMl,
  createDrinkSnapshot,
} from '../domain/models';
import { DEFAULT_SETTINGS, WaterTrackerDatabase } from './database';
import {
  DrinkRepository,
  EntryRepository,
  resetAllData,
  SettingsRepository,
} from './repositories';

describe('local database', () => {
  let database: WaterTrackerDatabase;

  beforeEach(() => {
    database = new WaterTrackerDatabase(
      `water-tracker-test-${crypto.randomUUID()}`,
    );
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it('создаёт схему первой версии и заполняет начальные данные', async () => {
    await database.open();

    expect(database.verno).toBe(1);
    expect(await database.drinks.count()).toBe(BUILTIN_DRINKS.length);
    expect(await new SettingsRepository(database).get()).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it('сохраняет пользовательский напиток после повторного открытия базы', async () => {
    const repository = new DrinkRepository(database);
    const now = '2026-07-11T12:00:00.000Z';

    await repository.save({
      id: 'custom-cocoa',
      name: 'Какао',
      hydrationPercent: 85,
      standardVolumeMl: 250,
      color: '#A56A43',
      icon: 'custom',
      isBuiltin: false,
      createdAt: now,
      updatedAt: now,
    });
    database.close();
    await database.open();

    expect(await repository.get('custom-cocoa')).toMatchObject({
      name: 'Какао',
    });
  });

  it('получает записи из заданного временного диапазона', async () => {
    const repository = new EntryRepository(database);
    const water = BUILTIN_DRINKS[0]!;
    const volumeMl = 250;

    await repository.save({
      id: 'entry-1',
      drinkId: water.id,
      drink: createDrinkSnapshot(water),
      volumeMl,
      effectiveHydrationMl: calculateEffectiveHydrationMl(
        volumeMl,
        water.hydrationPercent,
      ),
      consumedAt: '2026-07-11T09:00:00.000Z',
      createdAt: '2026-07-11T09:00:00.000Z',
      updatedAt: '2026-07-11T09:00:00.000Z',
    });

    await expect(
      repository.listBetween(
        '2026-07-11T00:00:00.000Z',
        '2026-07-12T00:00:00.000Z',
      ),
    ).resolves.toHaveLength(1);
  });

  it('защищает встроенные напитки от удаления', async () => {
    const repository = new DrinkRepository(database);
    await database.open();

    await expect(repository.delete('builtin-water')).rejects.toThrow(
      'Встроенный напиток нельзя удалить',
    );
  });

  it('защищает встроенные напитки от изменения', async () => {
    const repository = new DrinkRepository(database);

    await expect(
      repository.save({ ...BUILTIN_DRINKS[0]!, name: 'Другая вода' }),
    ).rejects.toThrow('Встроенный напиток нельзя изменить');
  });

  it('атомарно сбрасывает записи, пользовательские напитки и настройки', async () => {
    const drinks = new DrinkRepository(database);
    const settings = new SettingsRepository(database);
    const now = '2026-07-11T12:00:00.000Z';
    await drinks.save({
      id: 'custom-reset',
      name: 'Лимонад',
      hydrationPercent: 80,
      standardVolumeMl: 300,
      color: '#E1B941',
      icon: 'custom',
      isBuiltin: false,
      createdAt: now,
      updatedAt: now,
    });
    await settings.save({ version: 1, dailyGoalMl: 3_000, theme: 'dark' });

    await resetAllData(database);

    expect(await database.entries.count()).toBe(0);
    expect(await database.drinks.count()).toBe(BUILTIN_DRINKS.length);
    expect(await settings.get()).toEqual(DEFAULT_SETTINGS);
  });
});
