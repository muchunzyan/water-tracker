import { useState, type FormEvent } from 'react';

import { saveSettings } from '../../data/hooks';
import { calculateRecommendedGoalMl } from '../../domain/hydration-goal';
import {
  hydrationProfileSchema,
  type ActivityLevel,
  type Settings,
} from '../../domain/models';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { TextField } from '../../ui/TextField/TextField';
import styles from './OnboardingPage.module.css';

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  low: 'Низкая',
  moderate: 'Средняя',
  high: 'Высокая',
};

export function OnboardingPage({ settings }: { settings: Settings }) {
  const [heightCm, setHeightCm] = useState(
    String(settings.hydrationProfile?.heightCm ?? 170),
  );
  const [weightKg, setWeightKg] = useState(
    String(settings.hydrationProfile?.weightKg ?? 70),
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    settings.hydrationProfile?.activityLevel ?? 'moderate',
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const profileResult = hydrationProfileSchema.safeParse({
    heightCm: Number(heightCm),
    weightKg: Number(weightKg),
    activityLevel,
  });
  const recommendedGoal = profileResult.success
    ? calculateRecommendedGoalMl(profileResult.data)
    : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profileResult.success || recommendedGoal === null) {
      setError('Проверьте рост, вес и уровень активности.');
      return;
    }

    try {
      setError('');
      setIsSaving(true);
      await saveSettings({
        ...settings,
        dailyGoalMl: recommendedGoal,
        hydrationProfile: profileResult.data,
        onboardingCompleted: true,
      });
    } catch {
      setError('Не удалось сохранить параметры. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        <span aria-hidden="true">
          <img alt="" src={`${import.meta.env.BASE_URL}icon.svg`} />
        </span>
        <strong>Oasis — Water Tracker</strong>
      </div>
      <Card className={styles.card}>
        <div>
          <p className={styles.eyebrow}>Первый запуск</p>
          <h1>Настроим вашу дневную цель</h1>
          <p className={styles.description}>
            Укажите параметры, чтобы получить ориентировочную норму воды. Её
            всегда можно изменить в настройках.
          </p>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className={styles.fields}>
            <TextField
              inputMode="numeric"
              label="Рост, см"
              max={230}
              min={120}
              onChange={(event) => setHeightCm(event.target.value)}
              required
              type="number"
              value={heightCm}
            />
            <TextField
              inputMode="decimal"
              label="Вес, кг"
              max={300}
              min={30}
              onChange={(event) => setWeightKg(event.target.value)}
              required
              step="0.1"
              type="number"
              value={weightKg}
            />
          </div>
          <fieldset className={styles.activityPicker}>
            <legend>Физическая активность</legend>
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
              <label key={level}>
                <input
                  checked={activityLevel === level}
                  name="activity"
                  onChange={() => setActivityLevel(level)}
                  type="radio"
                  value={level}
                />
                <span>{ACTIVITY_LABELS[level]}</span>
              </label>
            ))}
          </fieldset>
          <div className={styles.result} aria-live="polite">
            <span>Ориентировочная дневная цель</span>
            <strong>
              {recommendedGoal === null
                ? 'Заполните параметры'
                : `${recommendedGoal.toLocaleString('ru-RU')} мл`}
            </strong>
          </div>
          <p className={styles.disclaimer}>
            Расчёт является ориентиром для здорового взрослого и не заменяет
            рекомендации врача. Потребность меняется из-за климата, здоровья,
            беременности и других факторов.
          </p>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <Button
            disabled={!profileResult.success}
            isLoading={isSaving}
            type="submit"
          >
            Сохранить и продолжить
          </Button>
        </form>
      </Card>
    </main>
  );
}
