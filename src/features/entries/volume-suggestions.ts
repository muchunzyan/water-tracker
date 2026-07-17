import type { Drink, HydrationEntry } from '../../domain/models';

const FALLBACK_VOLUMES = [200, 250, 330, 500] as const;

export function getQuickVolumes(entries: readonly HydrationEntry[], limit = 4) {
  const frequencies = new Map<number, { count: number; lastUsedAt: number }>();

  for (const entry of entries) {
    if (
      !Number.isInteger(entry.volumeMl) ||
      entry.volumeMl < 1 ||
      entry.volumeMl > 5_000
    )
      continue;

    const current = frequencies.get(entry.volumeMl);
    frequencies.set(entry.volumeMl, {
      count: (current?.count ?? 0) + 1,
      lastUsedAt: Math.max(
        current?.lastUsedAt ?? 0,
        parseTimestamp(entry.consumedAt),
      ),
    });
  }

  const frequent = [...frequencies.entries()]
    .sort(([volumeA, statsA], [volumeB, statsB]) => {
      return (
        statsB.count - statsA.count ||
        statsB.lastUsedAt - statsA.lastUsedAt ||
        volumeA - volumeB
      );
    })
    .map(([volume]) => volume);

  return [...frequent, ...FALLBACK_VOLUMES]
    .filter((volume, index, volumes) => volumes.indexOf(volume) === index)
    .slice(0, limit);
}

export function getEntryDefaults(
  entries: readonly HydrationEntry[],
  drinks: readonly Drink[],
) {
  const fallbackDrink =
    drinks.find((drink) => drink.id === 'builtin-water') ?? drinks[0];
  const lastEntry = [...entries].sort(
    (entryA, entryB) =>
      parseTimestamp(entryB.consumedAt) - parseTimestamp(entryA.consumedAt),
  )[0];
  const selectedDrink =
    drinks.find((drink) => drink.id === lastEntry?.drinkId) ?? fallbackDrink;

  return {
    drinkId: selectedDrink?.id ?? '',
    volumeMl:
      lastEntry &&
      Number.isInteger(lastEntry.volumeMl) &&
      lastEntry.volumeMl >= 1 &&
      lastEntry.volumeMl <= 5_000
        ? lastEntry.volumeMl
        : (selectedDrink?.standardVolumeMl ?? 250),
  };
}

function parseTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
