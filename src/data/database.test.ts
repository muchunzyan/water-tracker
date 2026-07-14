import 'fake-indexeddb/auto';

import Dexie from 'dexie';

import {
  BUILTIN_DRINKS,
  NEW_BUILTIN_DRINKS_V2,
} from '../domain/builtin-drinks';
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

    expect(database.verno).toBe(2);
    expect(await database.drinks.count()).toBe(BUILTIN_DRINKS.length);
    expect(await new SettingsRepository(database).get()).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it('добавляет расширенный каталог при миграции базы версии 1', async () => {
    database.close();
    await database.delete();
    const legacy = new Dexie(database.name);
    legacy.version(1).stores({
      drinks: 'id, isBuiltin, name, updatedAt',
      entries: 'id, drinkId, consumedAt, createdAt',
      settings: 'id',
    });
    await legacy.open();
    await legacy.table('drinks').add(BUILTIN_DRINKS[0]!);
    legacy.close();

    database = new WaterTrackerDatabase(database.name);
    await database.open();

    expect(await database.drinks.count()).toBe(
      1 + NEW_BUILTIN_DRINKS_V2.length,
    );
    expect(await database.drinks.get('builtin-sparkling-water')).toBeDefined();
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

  it('удаляет и восстанавливает встроенные напитки', async () => {
    const repository = new DrinkRepository(database);
    await database.open();

    await expect(repository.delete('builtin-water')).resolves.toBe(true);
    await expect(repository.get('builtin-water')).resolves.toBeUndefined();

    await repository.restoreBuiltins();
    await expect(repository.get('builtin-water')).resolves.toMatchObject({
      name: 'Вода',
      isBuiltin: true,
    });
  });

  it('сохраняет пользовательские параметры встроенного напитка', async () => {
    const repository = new DrinkRepository(database);

    await repository.save({ ...BUILTIN_DRINKS[0]!, name: 'Другая вода' });

    await expect(repository.get('builtin-water')).resolves.toMatchObject({
      name: 'Другая вода',
      isBuiltin: true,
    });
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
    await settings.save({
      version: 1,
      dailyGoalMl: 3_000,
      theme: 'dark',
      onboardingCompleted: true,
    });

    await resetAllData(database);

    expect(await database.entries.count()).toBe(0);
    expect(await database.drinks.count()).toBe(BUILTIN_DRINKS.length);
    expect(await settings.get()).toEqual(DEFAULT_SETTINGS);
  });
});
