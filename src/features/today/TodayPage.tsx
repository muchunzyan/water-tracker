import { useEffect, useMemo, useRef, useState } from 'react';

import { useEntries, useEntriesBetween, useSettings } from '../../data/hooks';
import { entryRepository } from '../../data/repositories';
import type { HydrationEntry } from '../../domain/models';
import {
  calculateProgressPercent,
  calculateRemainingMl,
} from '../../domain/progress';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { Icon } from '../../ui/Icon/Icon';
import { Spinner } from '../../ui/Spinner/Spinner';
import { AddEntrySheet } from '../entries/AddEntrySheet';
import { EntryCard } from '../entries/EntryCard';
import { getLocalDayRange } from './date-range';
import {
  calculateHydrationStreak,
  formatHydrationStreak,
} from './hydration-streak';
import styles from './TodayPage.module.css';

export function TodayPage() {
  const range = useMemo(() => getLocalDayRange(new Date()), []);
  const entries = useEntriesBetween(range.startInclusive, range.endExclusive);
  const allEntries = useEntries();
  const settings = useSettings();
  const [editorEntry, setEditorEntry] = useState<HydrationEntry | null>();
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [isCelebrating, setIsCelebrating] = useState(false);
  const previousProgress = useRef<number | null>(null);
  const totalVolumeMl =
    entries?.reduce((sum, entry) => sum + entry.volumeMl, 0) ?? 0;
  const effectiveHydrationMl =
    entries?.reduce((sum, entry) => sum + entry.effectiveHydrationMl, 0) ?? 0;
  const goalMl = settings?.dailyGoalMl ?? 2_000;
  const progress = calculateProgressPercent(effectiveHydrationMl, goalMl);
  const visualProgress = Math.min(progress, 100);
  const remainingMl = calculateRemainingMl(effectiveHydrationMl, goalMl);
  const hydrationStreak = calculateHydrationStreak(allEntries ?? [], goalMl);
  const isHydrationLoaded = entries !== undefined && settings !== undefined;

  useEffect(() => {
    if (!isHydrationLoaded) return;

    if (
      previousProgress.current !== null &&
      previousProgress.current < 100 &&
      progress >= 100
    ) {
      setIsCelebrating(true);
    }

    previousProgress.current = progress;
  }, [isHydrationLoaded, progress]);

  useEffect(() => {
    if (!isCelebrating) return;

    const timeout = window.setTimeout(() => setIsCelebrating(false), 1_800);
    return () => window.clearTimeout(timeout);
  }, [isCelebrating]);

  async function handleDelete(entry: HydrationEntry) {
    if (
      !window.confirm(
        `Удалить запись «${entry.drink.name}, ${entry.volumeMl} мл»?`,
      )
    ) {
      return;
    }

    try {
      setError('');
      await entryRepository.delete(entry.id);
      setNotification('Запись удалена');
    } catch {
      setError('Не удалось удалить запись. Попробуйте ещё раз.');
    }
  }

  return (
    <div className={styles.layout}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>Сегодня</p>
        <h1 className={styles.title}>{getGreeting()}</h1>
        <p className={styles.description}>
          {getProgressMessage(progress, entries?.length ?? 0)}
        </p>
      </section>

      <Card
        className={`${styles.progressCard} ${isCelebrating ? styles.goalReached : ''}`}
        data-celebrating={isCelebrating || undefined}
      >
        {isCelebrating ? (
          <span
            aria-hidden="true"
            className={styles.celebration}
            data-testid="goal-celebration"
          >
            {Array.from({ length: 9 }, (_, index) => (
              <span key={index} />
            ))}
          </span>
        ) : null}
        <div
          aria-label={`Выполнено ${progress}% дневной цели`}
          className={styles.progressRing}
          role="img"
          style={
            {
              '--progress': `${visualProgress * 3.6}deg`,
            } as React.CSSProperties
          }
        >
          <div>
            <Icon name="droplet" size={30} />
            <strong>{progress}%</strong>
          </div>
        </div>
        <div className={styles.summary}>
          <p className={styles.cardLabel}>Эффективная гидратация</p>
          <p className={styles.amount}>
            {formatMl(effectiveHydrationMl)} из {formatMl(goalMl)} мл
          </p>
          <p>Всего выпито: {formatMl(totalVolumeMl)} мл</p>
          <p className={styles.remaining}>
            {remainingMl > 0
              ? `Осталось ${formatMl(remainingMl)} мл`
              : 'Цель выполнена'}
          </p>
          <p
            aria-label={`Серия выполненной цели: ${formatHydrationStreak(hydrationStreak)}`}
            className={styles.streak}
          >
            <Icon name="streak" size={16} />
            Серия: {formatHydrationStreak(hydrationStreak)}
          </p>
        </div>
        <Button
          icon={<Icon name="add" size={20} />}
          onClick={() => {
            setNotification('');
            setEditorEntry(null);
          }}
        >
          Добавить запись
        </Button>
      </Card>

      {notification ? (
        <p className={styles.notification} role="status">
          {notification}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {entries === undefined || settings === undefined ? (
        <Card className={styles.loading}>
          <Spinner label="Загружаем сегодняшний день" />
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            action={
              <Button onClick={() => setEditorEntry(null)}>
                Добавить первую запись
              </Button>
            }
            description="Первая запись появится здесь сразу после добавления напитка."
            icon={<Icon name="history" size={28} />}
            title="Сегодня записей пока нет"
          />
        </Card>
      ) : (
        <section
          aria-labelledby="recent-entries-title"
          className={styles.entriesSection}
        >
          <div className={styles.sectionHeader}>
            <h2 id="recent-entries-title">Последние записи</h2>
            <span
              aria-label={`Записей за сегодня: ${entries.length}`}
              className={styles.entryCount}
            >
              {entries.length}
            </span>
          </div>
          <div className={styles.entries}>
            {entries.slice(0, 6).map((entry) => (
              <EntryCard
                entry={entry}
                key={entry.id}
                onDelete={handleDelete}
                onEdit={setEditorEntry}
              />
            ))}
          </div>
        </section>
      )}

      {editorEntry !== undefined ? (
        <AddEntrySheet
          entry={editorEntry ?? undefined}
          key={editorEntry?.id ?? 'new'}
          onClose={() => setEditorEntry(undefined)}
          onSaved={(message) => {
            setEditorEntry(undefined);
            setNotification(message);
          }}
        />
      ) : null}
    </div>
  );
}

function formatMl(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи!';
  if (hour < 12) return 'Доброе утро!';
  if (hour < 18) return 'Добрый день!';
  return 'Добрый вечер!';
}

function getProgressMessage(progress: number, entryCount: number) {
  if (entryCount === 0)
    return 'Начните отмечать напитки, а мы посчитаем гидратацию.';
  if (progress >= 120)
    return 'Цель заметно превышена — отличный запас гидратации.';
  if (progress >= 100) return 'Дневная цель достигнута!';
  if (progress >= 60) return 'Большая часть цели уже выполнена.';
  return 'Хорошее начало — продолжайте пить регулярно.';
}
