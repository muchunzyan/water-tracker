import { useLiveQuery } from 'dexie-react-hooks';

import {
  drinkRepository,
  entryRepository,
  settingsRepository,
} from './repositories';
import type { Settings } from '../domain/models';

export function useDrinks() {
  return useLiveQuery(() => drinkRepository.list(), []);
}

export function useEntries() {
  return useLiveQuery(() => entryRepository.list(), []);
}

export function useEntriesBetween(
  startInclusive: string,
  endExclusive: string,
) {
  return useLiveQuery(
    () => entryRepository.listBetween(startInclusive, endExclusive),
    [startInclusive, endExclusive],
  );
}

export function useSettings() {
  return useLiveQuery(() => settingsRepository.get(), []);
}

export function saveSettings(settings: Settings) {
  return settingsRepository.save(settings);
}

export function updateSettings(patch: Partial<Settings>) {
  return settingsRepository.update(patch);
}
