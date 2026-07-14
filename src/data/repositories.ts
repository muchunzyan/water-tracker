import type { WaterTrackerDatabase } from './database';
import { DEFAULT_SETTINGS, db } from './database';
import { BUILTIN_DRINKS } from '../domain/builtin-drinks';
import {
  drinkSchema,
  hydrationEntrySchema,
  settingsSchema,
  type Drink,
  type HydrationEntry,
  type Settings,
} from '../domain/models';

export class DrinkRepository {
  constructor(private readonly database: WaterTrackerDatabase = db) {}

  list() {
    return this.database.drinks.orderBy('name').toArray();
  }

  get(id: string) {
    return this.database.drinks.get(id);
  }

  async save(drink: Drink) {
    const validDrink = drinkSchema.parse(drink);
    await this.database.drinks.put(validDrink);
    return validDrink;
  }

  async delete(id: string) {
    const drink = await this.database.drinks.get(id);

    if (!drink) return false;
    await this.database.drinks.delete(id);
    return true;
  }

  async restoreBuiltins() {
    await this.database.drinks.bulkPut([...BUILTIN_DRINKS]);
  }
}

export class EntryRepository {
  constructor(private readonly database: WaterTrackerDatabase = db) {}

  list() {
    return this.database.entries.orderBy('consumedAt').reverse().toArray();
  }

  listBetween(startInclusive: string, endExclusive: string) {
    return this.database.entries
      .where('consumedAt')
      .between(startInclusive, endExclusive, true, false)
      .reverse()
      .sortBy('consumedAt');
  }

  get(id: string) {
    return this.database.entries.get(id);
  }

  async save(entry: HydrationEntry) {
    const validEntry = hydrationEntrySchema.parse(entry);
    await this.database.entries.put(validEntry);
    return validEntry;
  }

  async delete(id: string) {
    await this.database.entries.delete(id);
  }
}

export class SettingsRepository {
  constructor(private readonly database: WaterTrackerDatabase = db) {}

  async get(): Promise<Settings> {
    const stored = await this.database.settings.get('settings');
    if (!stored) return DEFAULT_SETTINGS;

    return settingsSchema.parse(stored);
  }

  async save(settings: Settings) {
    const validSettings = settingsSchema.parse(settings);
    await this.database.settings.put({ id: 'settings', ...validSettings });
    return validSettings;
  }
}

export const drinkRepository = new DrinkRepository();
export const entryRepository = new EntryRepository();
export const settingsRepository = new SettingsRepository();

export async function resetAllData(database: WaterTrackerDatabase = db) {
  await database.transaction(
    'rw',
    [database.drinks, database.entries, database.settings],
    async () => {
      await database.entries.clear();
      await database.drinks.clear();
      await database.drinks.bulkAdd([...BUILTIN_DRINKS]);
      await database.settings.put({ id: 'settings', ...DEFAULT_SETTINGS });
    },
  );
}
