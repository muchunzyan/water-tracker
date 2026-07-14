import { useMemo, useState, type FormEvent } from 'react';

import { useDrinks, useEntries } from '../../data/hooks';
import { entryRepository } from '../../data/repositories';
import {
  calculateEffectiveHydrationMl,
  createDrinkSnapshot,
  hydrationEntrySchema,
  type Drink,
  type HydrationEntry,
} from '../../domain/models';
import { BottomSheet } from '../../ui/BottomSheet/BottomSheet';
import { Button } from '../../ui/Button/Button';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { Icon } from '../../ui/Icon/Icon';
import { Spinner } from '../../ui/Spinner/Spinner';
import { TextField } from '../../ui/TextField/TextField';
import styles from './AddEntrySheet.module.css';
import { getDefaultVolume, getQuickVolumes } from './volume-suggestions';

interface AddEntrySheetProps {
  entry?: HydrationEntry | undefined;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function AddEntrySheet({ entry, onClose, onSaved }: AddEntrySheetProps) {
  const drinks = useDrinks();
  const entries = useEntries();
  const [selectedDrinkId, setSelectedDrinkId] = useState(entry?.drinkId ?? '');
  const [volumeOverride, setVolumeOverride] = useState<string | null>(
    entry ? String(entry.volumeMl) : null,
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const historicalDrink: Drink | undefined =
    entry && drinks && !drinks.some((drink) => drink.id === entry.drinkId)
      ? {
          id: entry.drinkId,
          ...entry.drink,
          standardVolumeMl: entry.volumeMl,
          isBuiltin: false,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }
      : undefined;
  const availableDrinks = historicalDrink
    ? [historicalDrink, ...(drinks ?? [])]
    : drinks;
  const selectedDrink =
    availableDrinks?.find((drink) => drink.id === selectedDrinkId) ??
    availableDrinks?.find((drink) => drink.id === 'builtin-water') ??
    availableDrinks?.[0];
  const quickVolumes = useMemo(() => getQuickVolumes(entries ?? []), [entries]);
  const volume =
    volumeOverride ??
    String(
      selectedDrink
        ? getDefaultVolume(entries ?? [], selectedDrink)
        : (entry?.volumeMl ?? 250),
    );
  const volumeMl = Number(volume);
  const isValidVolume =
    Number.isInteger(volumeMl) && volumeMl >= 1 && volumeMl <= 5_000;
  const effectiveHydrationMl = selectedDrink
    ? calculateEffectiveHydrationMl(
        isValidVolume ? volumeMl : 0,
        selectedDrink.hydrationPercent,
      )
    : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDrink) {
      setError('Сначала выберите напиток.');
      return;
    }

    if (!isValidVolume) {
      setError('Введите целый объём от 1 до 5 000 мл.');
      return;
    }

    const now = new Date().toISOString();
    const result = hydrationEntrySchema.safeParse({
      id: entry?.id ?? crypto.randomUUID(),
      drinkId: selectedDrink.id,
      drink: createDrinkSnapshot(selectedDrink),
      volumeMl,
      effectiveHydrationMl,
      consumedAt: entry?.consumedAt ?? now,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    });

    if (!result.success) {
      setError(
        result.error.issues[0]?.message ?? 'Не удалось проверить запись.',
      );
      return;
    }

    try {
      setError('');
      setIsSaving(true);
      await entryRepository.save(result.data);
      onSaved(
        `${selectedDrink.name}: ${entry ? 'обновлено' : 'добавлено'} ${volumeMl} мл (${effectiveHydrationMl} мл гидратации)`,
      );
    } catch {
      setError('Не удалось сохранить запись. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={entry ? 'Изменить запись' : 'Добавить запись'}
    >
      {drinks === undefined ? (
        <div className={styles.loading}>
          <Spinner label="Загружаем напитки" />
        </div>
      ) : availableDrinks?.length === 0 ? (
        <EmptyState
          description="Сначала создайте напиток в каталоге."
          icon={<Icon name="drinks" size={28} />}
          title="Нет доступных напитков"
        />
      ) : (
        <form
          className={styles.form}
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className={styles.selectField}>
            <span>Напиток</span>
            <select
              onChange={(event) => setSelectedDrinkId(event.target.value)}
              value={selectedDrink?.id ?? ''}
            >
              {availableDrinks?.map((drink) => (
                <option key={drink.id} value={drink.id}>
                  {drink.name} · {drink.hydrationPercent}%
                </option>
              ))}
            </select>
          </label>

          <fieldset className={styles.quickVolumes}>
            <legend>Быстрый объём</legend>
            <div>
              {quickVolumes.map((quickVolume) => (
                <button
                  aria-pressed={volume === String(quickVolume)}
                  key={quickVolume}
                  onClick={() => {
                    setVolumeOverride(String(quickVolume));
                  }}
                  type="button"
                >
                  {quickVolume} мл
                </button>
              ))}
            </div>
          </fieldset>

          <TextField
            error={
              volume !== '' && !isValidVolume ? 'От 1 до 5 000 мл' : undefined
            }
            inputMode="numeric"
            label="Выпито, мл"
            max={5000}
            min={1}
            onChange={(event) => {
              setVolumeOverride(event.target.value);
            }}
            required
            type="number"
            value={volume}
          />

          <div className={styles.preview} aria-live="polite">
            <div>
              <Icon name="droplet" size={28} />
              <span>Эффективная гидратация</span>
            </div>
            <strong>{effectiveHydrationMl} мл</strong>
          </div>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button onClick={onClose} variant="ghost">
              Отмена
            </Button>
            <Button
              disabled={!isValidVolume}
              isLoading={isSaving}
              type="submit"
            >
              {entry ? 'Сохранить изменения' : 'Сохранить запись'}
            </Button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
