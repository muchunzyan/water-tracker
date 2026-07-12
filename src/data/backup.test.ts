import 'fake-indexeddb/auto';

import { ZodError } from 'zod';

import { createBackup, parseBackupJson, replaceFromBackup } from './backup';
import { WaterTrackerDatabase } from './database';
import { DrinkRepository, SettingsRepository } from './repositories';

describe('backup', () => {
  let database: WaterTrackerDatabase;

  beforeEach(() => {
    database = new WaterTrackerDatabase(
      `water-tracker-backup-${crypto.randomUUID()}`,
    );
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it('экспортирует и атомарно восстанавливает все stores', async () => {
    const drinks = new DrinkRepository(database);
    const settings = new SettingsRepository(database);
    const now = '2026-07-11T12:00:00.000Z';
    await drinks.save({
      id: 'custom-backup',
      name: 'Морс',
      hydrationPercent: 90,
      standardVolumeMl: 250,
      color: '#D45565',
      icon: 'juice',
      isBuiltin: false,
      createdAt: now,
      updatedAt: now,
    });
    await settings.save({ version: 1, dailyGoalMl: 2_500, theme: 'dark' });
    const backup = await createBackup(database);

    await database.drinks.delete('custom-backup');
    await settings.save({ version: 1, dailyGoalMl: 1_000, theme: 'light' });
    await replaceFromBackup(backup, database);

    expect(await database.drinks.get('custom-backup')).toMatchObject({
      name: 'Морс',
    });
    expect(await settings.get()).toMatchObject({
      dailyGoalMl: 2_500,
      theme: 'dark',
    });
  });

  it('отклоняет невалидный файл до изменения базы', async () => {
    const before = await database.drinks.count();

    await expect(
      replaceFromBackup(
        {
          version: 1,
          exportedAt: 'не дата',
          drinks: [],
          entries: [],
          settings: { version: 1, dailyGoalMl: -1, theme: 'dark' },
        },
        database,
      ),
    ).rejects.toBeInstanceOf(ZodError);
    expect(await database.drinks.count()).toBe(before);
  });

  it('отклоняет повреждённый JSON и повторяющиеся идентификаторы', () => {
    expect(() => parseBackupJson('{')).toThrow('корректный JSON');
    expect(() =>
      parseBackupJson(
        JSON.stringify({
          version: 1,
          exportedAt: '2026-07-11T12:00:00.000Z',
          drinks: [],
          entries: [createEntry('same'), createEntry('same')],
          settings: { version: 1, dailyGoalMl: 2_000, theme: 'system' },
        }),
      ),
    ).toThrow('повторяющиеся идентификаторы записей');
  });
});

function createEntry(id: string) {
  return {
    id,
    drinkId: 'deleted-drink',
    drink: {
      name: 'Удалённый напиток',
      hydrationPercent: 80,
      color: '#558899',
      icon: 'custom',
    },
    volumeMl: 250,
    effectiveHydrationMl: 200,
    consumedAt: '2026-07-11T12:00:00.000Z',
    createdAt: '2026-07-11T12:00:00.000Z',
    updatedAt: '2026-07-11T12:00:00.000Z',
  };
}
