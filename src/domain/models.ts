import { z } from 'zod';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export const ACTIVITY_LEVELS = ['low', 'moderate', 'high'] as const;
export const DRINK_ICONS = [
  'water',
  'sparkling',
  'tea',
  'coffee',
  'milk',
  'juice',
  'soda',
  'sports',
  'energy',
  'cocktail',
  'broth',
  'beer',
  'wine',
  'kvass',
  'custom',
] as const;

const identifierSchema = z.string().trim().min(1).max(100);
const timestampSchema = z.iso.datetime({ offset: true });
const hydrationPercentSchema = z.number().int().min(-500).max(150);
const colorSchema = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, 'Ожидается цвет в формате #RRGGBB');

export const drinkSnapshotSchema = z.object({
  name: z.string().trim().min(1).max(60),
  hydrationPercent: hydrationPercentSchema,
  color: colorSchema,
  icon: z.enum(DRINK_ICONS),
});

export const drinkSchema = drinkSnapshotSchema.extend({
  id: identifierSchema,
  isBuiltin: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const hydrationEntrySchema = z
  .object({
    id: identifierSchema,
    drinkId: identifierSchema,
    drink: drinkSnapshotSchema,
    volumeMl: z.number().int().min(1).max(5_000),
    effectiveHydrationMl: z.number().int().min(-25_000).max(7_500),
    consumedAt: timestampSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .superRefine((entry, context) => {
    const expected = calculateEffectiveHydrationMl(
      entry.volumeMl,
      entry.drink.hydrationPercent,
    );

    if (entry.effectiveHydrationMl !== expected) {
      context.addIssue({
        code: 'custom',
        path: ['effectiveHydrationMl'],
        message: `Ожидается рассчитанное значение ${expected} мл`,
      });
    }
  });

export const hydrationProfileSchema = z.object({
  heightCm: z.number().int().min(120).max(230),
  weightKg: z.number().min(30).max(300),
  activityLevel: z.enum(ACTIVITY_LEVELS),
});

export const settingsSchema = z.object({
  version: z.literal(1),
  dailyGoalMl: z.number().int().min(250).max(10_000),
  theme: z.enum(THEME_PREFERENCES),
  onboardingCompleted: z.boolean().default(false),
  hydrationProfile: hydrationProfileSchema.optional(),
});

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: timestampSchema,
  drinks: z.array(drinkSchema),
  entries: z.array(hydrationEntrySchema),
  settings: settingsSchema,
});

export type DrinkIcon = (typeof DRINK_ICONS)[number];
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type HydrationProfile = z.infer<typeof hydrationProfileSchema>;
export type DrinkSnapshot = z.infer<typeof drinkSnapshotSchema>;
export type Drink = z.infer<typeof drinkSchema>;
export type HydrationEntry = z.infer<typeof hydrationEntrySchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Backup = z.infer<typeof backupSchema>;

export function calculateEffectiveHydrationMl(
  volumeMl: number,
  hydrationPercent: number,
) {
  return Math.round((volumeMl * hydrationPercent) / 100);
}

export function createDrinkSnapshot(drink: Drink): DrinkSnapshot {
  return {
    name: drink.name,
    hydrationPercent: drink.hydrationPercent,
    color: drink.color,
    icon: drink.icon,
  };
}
