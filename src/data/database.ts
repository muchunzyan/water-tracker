import Dexie, { type EntityTable } from 'dexie';

import {
  BUILTIN_DRINKS,
  NEW_BUILTIN_DRINKS_V2,
} from '../domain/builtin-drinks';
import type { Drink, HydrationEntry, Settings } from '../domain/models';

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  dailyGoalMl: 2_000,
  theme: 'system',
  onboardingCompleted: false,
};

interface StoredSettings extends Settings {
  id: 'settings';
}

export class WaterTrackerDatabase extends Dexie {
  drinks!: EntityTable<Drink, 'id'>;
  entries!: EntityTable<HydrationEntry, 'id'>;
  settings!: EntityTable<StoredSettings, 'id'>;

  constructor(name = 'water-tracker') {
    super(name);

    this.version(1).stores({
      drinks: 'id, isBuiltin, name, updatedAt',
      entries: 'id, drinkId, consumedAt, createdAt',
      settings: 'id',
    });

    this.version(2)
      .stores({
        drinks: 'id, isBuiltin, name, updatedAt',
        entries: 'id, drinkId, consumedAt, createdAt',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        const drinks = transaction.table<Drink, string>('drinks');
        for (const drink of NEW_BUILTIN_DRINKS_V2) {
          if (!(await drinks.get(drink.id))) await drinks.add(drink);
        }
      });

    this.on('populate', async () => {
      await this.drinks.bulkAdd([...BUILTIN_DRINKS]);
      await this.settings.add({ id: 'settings', ...DEFAULT_SETTINGS });
    });
  }
}

export const db = new WaterTrackerDatabase();
