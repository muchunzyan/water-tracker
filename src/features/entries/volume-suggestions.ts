import type { Drink, HydrationEntry } from '../../domain/models';

const FALLBACK_VOLUMES = [200, 250, 330, 500] as const;

export function getQuickVolumes(entries: readonly HydrationEntry[], limit = 4) {
  const recent = entries
    .map((entry) => entry.volumeMl)
    .filter((volume, index, volumes) => {
      return (
        volume >= 1 && volume <= 5_000 && volumes.indexOf(volume) === index
      );
    });

  return [...recent, ...FALLBACK_VOLUMES]
    .filter((volume, index, volumes) => volumes.indexOf(volume) === index)
    .slice(0, limit);
}

export function getDefaultVolume(
  entries: readonly HydrationEntry[],
  drink: Drink,
) {
  return (
    entries.find((entry) => entry.drinkId === drink.id)?.volumeMl ??
    entries[0]?.volumeMl ??
    drink.standardVolumeMl
  );
}
