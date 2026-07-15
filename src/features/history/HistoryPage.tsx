import {
  addDays,
  format,
  isAfter,
  isSameDay,
  isToday,
  startOfWeek,
  subDays,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMemo, useState } from 'react';

import { Button as ShadcnButton } from '@/components/ui/button';
import { useEntriesBetween, useSettings } from '../../data/hooks';
import { entryRepository } from '../../data/repositories';
import type { HydrationEntry } from '../../domain/models';
import { calculateProgressPercent } from '../../domain/progress';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { Icon } from '../../ui/Icon/Icon';
import { Spinner } from '../../ui/Spinner/Spinner';
import { AddEntrySheet } from '../entries/AddEntrySheet';
import { getLocalDayRange } from '../today/date-range';
import { buildWeekSummary } from './week-summary';
import styles from './HistoryPage.module.css';

export function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [editorEntry, setEditorEntry] = useState<HydrationEntry>();
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const dayRange = getLocalDayRange(selectedDate);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekRange = {
    startInclusive: weekStart.toISOString(),
    endExclusive: addDays(weekStart, 7).toISOString(),
  };
  const dayEntries = useEntriesBetween(
    dayRange.startInclusive,
    dayRange.endExclusive,
  );
  const weekEntries = useEntriesBetween(
    weekRange.startInclusive,
    weekRange.endExclusive,
  );
  const settings = useSettings();
  const goalMl = settings?.dailyGoalMl ?? 2_000;
  const weekSummary = useMemo(
    () => buildWeekSummary(weekEntries ?? [], weekStart, goalMl),
    [goalMl, weekEntries, weekStart],
  );
  const dayVolumeMl =
    dayEntries?.reduce((sum, entry) => sum + entry.volumeMl, 0) ?? 0;
  const dayEffectiveMl =
    dayEntries?.reduce((sum, entry) => sum + entry.effectiveHydrationMl, 0) ??
    0;
  const dayProgress = calculateProgressPercent(dayEffectiveMl, goalMl);

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
      setNotification('Запись удалена.');
    } catch {
      setError('Не удалось удалить запись. Попробуйте ещё раз.');
    }
  }

  return (
    <div className={styles.layout}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Динамика</p>
          <h1 className={styles.title}>История</h1>
        </div>
        <div className={styles.dateNavigation}>
          <Button
            aria-label="Предыдущий день"
            onClick={() => setSelectedDate((date) => subDays(date, 1))}
            variant="ghost"
          >
            ←
          </Button>
          <strong>{formatSelectedDate(selectedDate)}</strong>
          <Button
            aria-label="Следующий день"
            disabled={isToday(selectedDate)}
            onClick={() => setSelectedDate((date) => addDays(date, 1))}
            variant="ghost"
          >
            →
          </Button>
        </div>
      </section>

      <Card className={styles.chartCard}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardLabel}>Неделя</p>
            <h2>
              {format(weekStart, 'd MMM', { locale: ru })} —{' '}
              {format(addDays(weekStart, 6), 'd MMM', { locale: ru })}
            </h2>
          </div>
          <span>Цель {formatMl(goalMl)} мл</span>
        </div>
        <div className={styles.chart} aria-label="Выполнение цели за неделю">
          {weekSummary.map((day) => (
            <ShadcnButton
              aria-label={`${format(day.date, 'EEEE, d MMMM', { locale: ru })}: ${day.progress}%`}
              aria-pressed={isSameDay(day.date, selectedDate)}
              disabled={isAfter(day.date, new Date())}
              key={day.date.toISOString()}
              onClick={() => setSelectedDate(day.date)}
              type="button"
              variant="ghost"
            >
              <span className={styles.barTrack}>
                {day.progress > 0 ? (
                  <span
                    className={styles.bar}
                    style={{ height: `${Math.min(day.progress, 100)}%` }}
                  />
                ) : null}
              </span>
              <strong>{day.progress}%</strong>
              <small>{format(day.date, 'EE', { locale: ru })}</small>
            </ShadcnButton>
          ))}
        </div>
      </Card>

      <Card className={styles.daySummary} data-testid="day-summary">
        <div>
          <p className={styles.cardLabel}>Итог дня</p>
          <h2>{formatMl(dayEffectiveMl)} мл гидратации</h2>
          <p>Выпито {formatMl(dayVolumeMl)} мл</p>
        </div>
        <strong>{dayProgress}%</strong>
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

      {dayEntries === undefined ||
      weekEntries === undefined ||
      settings === undefined ? (
        <Card className={styles.loading}>
          <Spinner label="Загружаем историю" />
        </Card>
      ) : dayEntries.length === 0 ? (
        <Card>
          <EmptyState
            description="В этот день напитки не добавлялись. Выберите другой день на диаграмме."
            icon={<Icon name="history" size={28} />}
            title="Записей нет"
          />
        </Card>
      ) : (
        <section
          className={styles.entries}
          aria-labelledby="history-entries-title"
        >
          <h2 id="history-entries-title">Записи за день</h2>
          {dayEntries.map((entry) => (
            <Card className={styles.entryCard} key={entry.id}>
              <span
                className={styles.entryColor}
                style={{ background: entry.drink.color }}
              />
              <div>
                <h3>{entry.drink.name}</h3>
                <p>
                  {format(new Date(entry.consumedAt), 'HH:mm')} ·{' '}
                  {entry.effectiveHydrationMl} мл гидратации
                </p>
              </div>
              <strong>{entry.volumeMl} мл</strong>
              <div className={styles.entryActions}>
                <Button onClick={() => setEditorEntry(entry)} variant="ghost">
                  Изменить
                </Button>
                <Button
                  onClick={() => void handleDelete(entry)}
                  variant="ghost"
                >
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      {editorEntry ? (
        <AddEntrySheet
          entry={editorEntry}
          key={editorEntry.id}
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

function formatSelectedDate(date: Date) {
  if (isToday(date)) return 'Сегодня';
  return format(date, 'd MMMM, EEEE', { locale: ru });
}

function formatMl(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}
