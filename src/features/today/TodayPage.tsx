import { useEffect, useMemo, useRef, useState } from 'react';

import {
  updateSettings,
  useEntries,
  useEntriesBetween,
  useSettings,
} from '../../data/hooks';
import { entryRepository } from '../../data/repositories';
import {
  calculateDailyGoalMl,
  getLocalDateKey,
  HEAT_ML_PER_DEGREE,
  HEAT_THRESHOLD_C,
  TRAINING_ML_PER_HOUR,
} from '../../domain/hydration-goal';
import type { HydrationEntry, Settings } from '../../domain/models';
import {
  calculateProgressPercent,
  calculateRemainingMl,
} from '../../domain/progress';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { Icon } from '../../ui/Icon/Icon';
import { Spinner } from '../../ui/Spinner/Spinner';
import { TextField } from '../../ui/TextField/TextField';
import { AddEntrySheet } from '../entries/AddEntrySheet';
import { EntryCard } from '../entries/EntryCard';
import { getLocalDayRange } from './date-range';
import {
  calculateHydrationStreak,
  formatHydrationStreak,
} from './hydration-streak';
import styles from './TodayPage.module.css';

type CelebrationStage = 'idle' | 'scrolling' | 'celebrating';

const SCROLL_COMPLETION_FALLBACK_MS = 700;

function scrollToPageTop(onComplete: () => void) {
  const isAlreadyAtTop = window.scrollY <= 1;
  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let isComplete = false;
  let frame: number | undefined;
  let timeout: number | undefined;

  const complete = () => {
    if (isComplete) return;

    isComplete = true;
    window.removeEventListener('scrollend', complete);
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    if (timeout !== undefined) window.clearTimeout(timeout);
    onComplete();
  };

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });

  if (isAlreadyAtTop || prefersReducedMotion) {
    frame = window.requestAnimationFrame(complete);
  } else {
    window.addEventListener('scrollend', complete, { once: true });
    timeout = window.setTimeout(complete, SCROLL_COMPLETION_FALLBACK_MS);
  }

  return () => {
    isComplete = true;
    window.removeEventListener('scrollend', complete);
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    if (timeout !== undefined) window.clearTimeout(timeout);
  };
}

export function TodayPage() {
  const todayKey = useCurrentDateKey();
  const range = useMemo(
    () => getLocalDayRange(new Date(`${todayKey}T12:00:00`)),
    [todayKey],
  );
  const entries = useEntriesBetween(range.startInclusive, range.endExclusive);
  const allEntries = useEntries();
  const settings = useSettings();
  const [editorEntry, setEditorEntry] = useState<HydrationEntry | null>();
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [celebrationStage, setCelebrationStage] =
    useState<CelebrationStage>('idle');
  const isCelebrating = celebrationStage === 'celebrating';
  const previousProgress = useRef<number | null>(null);
  const totalVolumeMl =
    entries?.reduce((sum, entry) => sum + entry.volumeMl, 0) ?? 0;
  const effectiveHydrationMl =
    entries?.reduce((sum, entry) => sum + entry.effectiveHydrationMl, 0) ?? 0;
  const goalMl = settings ? calculateDailyGoalMl(settings) : 2_000;
  const progress = calculateProgressPercent(effectiveHydrationMl, goalMl);
  const visualProgress = Math.min(progress, 100);
  const remainingMl = calculateRemainingMl(effectiveHydrationMl, goalMl);
  const hydrationStreak = calculateHydrationStreak(
    allEntries ?? [],
    settings?.dailyGoalMl ?? 2_000,
  );
  const isHydrationLoaded = entries !== undefined && settings !== undefined;

  useEffect(() => {
    if (!isHydrationLoaded) return;

    if (
      previousProgress.current !== null &&
      previousProgress.current < 100 &&
      progress >= 100
    ) {
      setCelebrationStage('scrolling');
    }

    previousProgress.current = progress;
  }, [isHydrationLoaded, progress]);

  useEffect(() => {
    if (celebrationStage !== 'scrolling') return;

    return scrollToPageTop(() => setCelebrationStage('celebrating'));
  }, [celebrationStage]);

  useEffect(() => {
    if (celebrationStage !== 'celebrating') return;

    const timeout = window.setTimeout(() => setCelebrationStage('idle'), 1_800);
    return () => window.clearTimeout(timeout);
  }, [celebrationStage]);

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

      {settings ? (
        <DailyFactors
          onError={setError}
          settings={settings}
          todayKey={todayKey}
        />
      ) : null}

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

function useCurrentDateKey() {
  const [dateKey, setDateKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      1,
    );
    const timeout = window.setTimeout(
      () => setDateKey(getLocalDateKey()),
      nextDay.getTime() - now.getTime(),
    );
    return () => window.clearTimeout(timeout);
  }, [dateKey]);

  return dateKey;
}

function formatTrainingHours(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(value);
}

function isValidTrainingHours(value: string) {
  const normalized = value.replace(',', '.');
  if (!/^\d{1,2}(?:\.\d{0,2})?$/.test(normalized)) return false;
  const hours = Number(normalized);
  return Number.isFinite(hours) && hours >= 0 && hours <= 24;
}

function DailyFactors({
  onError,
  settings,
  todayKey,
}: {
  onError: (message: string) => void;
  settings: Settings;
  todayKey: string;
}) {
  const [trainingHours, setTrainingHours] = useState(() =>
    settings.training?.date === todayKey
      ? formatTrainingHours(settings.training.hours)
      : '0',
  );
  const adjustmentDescription = getAdjustmentDescription(settings);

  useEffect(() => {
    const normalized = trainingHours.replace(',', '.');
    if (!/^\d{1,2}(?:\.\d{0,2})?$/.test(normalized)) return;
    const hours = Number(normalized);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) return;
    if (
      settings.training?.date === todayKey &&
      settings.training.hours === hours
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void updateSettings({ training: { date: todayKey, hours } }).catch(() =>
        onError('Не удалось сохранить часы тренировок'),
      );
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [onError, settings.training, todayKey, trainingHours]);

  return (
    <Card className={styles.dailyFactors}>
      <div className={styles.dailyFactorsSummary}>
        <h2>Поправка на сегодня</h2>
        <div className={styles.dailyFactorsDetails}>
          {adjustmentDescription.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <TextField
        error={
          isValidTrainingHours(trainingHours)
            ? undefined
            : 'Введите число от 0 до 24, не более двух знаков после запятой'
        }
        inputMode="decimal"
        label="Часов тренировок сегодня"
        onChange={(event) => {
          const value = event.target.value;
          if (/^\d{0,2}(?:[.,]\d{0,2})?$/.test(value)) {
            setTrainingHours(value);
          }
        }}
        type="text"
        value={trainingHours}
      />
    </Card>
  );
}

function getAdjustmentDescription(settings: Settings) {
  const dateKey = getLocalDateKey();
  const trainingHours =
    settings.training?.date === dateKey ? settings.training.hours : 0;
  const lines = [
    `Тренировки: +${formatMl(trainingHours * TRAINING_ML_PER_HOUR)} мл`,
  ];

  if (!settings.useTemperatureAdjustment) {
    lines.push('Температура не учитывается');
  } else if (settings.weather?.date !== dateKey) {
    lines.push('Прогноз на сегодня пока недоступен');
  } else {
    const heatAdjustment =
      Math.max(0, settings.weather.maxTemperatureC - HEAT_THRESHOLD_C) *
      HEAT_ML_PER_DEGREE;
    lines.push(
      `Температура до ${settings.weather.maxTemperatureC} °C: +${formatMl(heatAdjustment)} мл`,
    );
  }

  return lines;
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
