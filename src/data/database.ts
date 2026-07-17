import Dexie, { type EntityTable } from 'dexie';

import {
  BUILTIN_DRINKS,
  NEW_BUILTIN_DRINKS_V2,
  PREVIOUS_BUILTIN_IDS_V3,
  PREVIOUS_BUILTIN_TIMESTAMPS,
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

    this.version(3)
      .stores({
        drinks: 'id, isBuiltin, name, updatedAt',
        entries: 'id, drinkId, consumedAt, createdAt',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        const drinks = transaction.table<Drink, string>('drinks');
        for (const definition of BUILTIN_DRINKS) {
          const stored = await drinks.get(definition.id);
          if (
            stored?.isBuiltin &&
            stored.updatedAt === definition.updatedAt &&
            stored.icon !== definition.icon
          ) {
            await drinks.put({ ...stored, icon: definition.icon });
          }
        }
      });

    this.version(4)
      .stores({
        drinks: 'id, isBuiltin, name, updatedAt',
        entries: 'id, drinkId, consumedAt, createdAt',
        settings: 'id',
      })
      .upgrade(async (transaction) => {
        const drinks = transaction.table<Drink, string>('drinks');
        const definitions = new Map(
          BUILTIN_DRINKS.map((drink) => [drink.id, drink]),
        );
        const storedBuiltins = (await drinks.toArray()).filter(
          (drink) => drink.isBuiltin,
        );

        for (const stored of storedBuiltins) {
          if (!PREVIOUS_BUILTIN_TIMESTAMPS.has(stored.updatedAt)) continue;

          const definition = definitions.get(stored.id);
          if (definition) await drinks.put(definition);
          else await drinks.delete(stored.id);
        }

        for (const definition of BUILTIN_DRINKS) {
          if (await drinks.get(definition.id)) continue;

          // Отсутствующий старый ID означает, что пользователь ранее удалил его.
          if (PREVIOUS_BUILTIN_IDS_V3.has(definition.id)) continue;
          await drinks.add(definition);
        }
      });

    this.on('populate', async () => {
      await this.drinks.bulkAdd([...BUILTIN_DRINKS]);
      await this.settings.add({ id: 'settings', ...DEFAULT_SETTINGS });
    });
  }
}

export const db = new WaterTrackerDatabase();
