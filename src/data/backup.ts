import type { WaterTrackerDatabase } from './database';
import { db } from './database';
import { SettingsRepository } from './repositories';
import { backupSchema, type Backup } from '../domain/models';

export async function createBackup(
  database: WaterTrackerDatabase = db,
): Promise<Backup> {
  const [drinks, entries, settings] = await Promise.all([
    database.drinks.toArray(),
    database.entries.toArray(),
    new SettingsRepository(database).get(),
  ]);

  return backupSchema.parse({
    version: 1,
    exportedAt: new Date().toISOString(),
    drinks,
    entries,
    settings,
  });
}

export function parseBackupJson(json: string): Backup {
  let value: unknown;

  try {
    value = JSON.parse(json) as unknown;
  } catch {
    throw new Error('Файл не содержит корректный JSON');
  }

  const backup = backupSchema.parse(value);
  assertUniqueIds(backup.drinks, 'напитков');
  assertUniqueIds(backup.entries, 'записей');
  return backup;
}

export async function replaceFromBackup(
  untrustedBackup: unknown,
  database: WaterTrackerDatabase = db,
) {
  const backup = backupSchema.parse(untrustedBackup);
  assertUniqueIds(backup.drinks, 'напитков');
  assertUniqueIds(backup.entries, 'записей');

  await database.transaction(
    'rw',
    [database.drinks, database.entries, database.settings],
    async () => {
      await database.entries.clear();
      await database.drinks.clear();
      await database.settings.clear();
      await database.drinks.bulkAdd(backup.drinks);
      await database.entries.bulkAdd(backup.entries);
      await database.settings.add({ id: 'settings', ...backup.settings });
    },
  );

  return backup;
}

function assertUniqueIds(items: readonly { id: string }[], entityName: string) {
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== items.length) {
    throw new Error(
      `Резервная копия содержит повторяющиеся идентификаторы ${entityName}`,
    );
  }
}
