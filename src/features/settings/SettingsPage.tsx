import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useTheme } from '../../app/providers/theme-context';
import {
  createBackup,
  parseBackupJson,
  replaceFromBackup,
} from '../../data/backup';
import { saveSettings, useSettings } from '../../data/hooks';
import { drinkRepository, resetAllData } from '../../data/repositories';
import {
  ACTIVITY_LEVELS,
  settingsSchema,
  THEME_PREFERENCES,
  type ActivityLevel,
  type Settings,
  type ThemePreference,
} from '../../domain/models';
import { calculateRecommendedGoalMl } from '../../domain/hydration-goal';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { Spinner } from '../../ui/Spinner/Spinner';
import { TextField } from '../../ui/TextField/TextField';
import styles from './SettingsPage.module.css';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Как на устройстве',
  light: 'Светлая',
  dark: 'Тёмная',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  low: 'Низкая',
  moderate: 'Средняя',
  high: 'Высокая',
};

export function SettingsPage() {
  const settings = useSettings();

  if (!settings) {
    return (
      <Card className={styles.loading}>
        <Spinner label="Загружаем настройки" />
      </Card>
    );
  }

  return <SettingsContent initialSettings={settings} />;
}

function SettingsContent({ initialSettings }: { initialSettings: Settings }) {
  const { preference, setPreference } = useTheme();
  const [dailyGoal, setDailyGoal] = useState(
    String(initialSettings.dailyGoalMl),
  );
  const [heightCm, setHeightCm] = useState(
    String(initialSettings.hydrationProfile?.heightCm ?? 170),
  );
  const [weightKg, setWeightKg] = useState(
    String(initialSettings.hydrationProfile?.weightKg ?? 70),
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialSettings.hydrationProfile?.activityLevel ?? 'moderate',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');

  async function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = settingsSchema.safeParse({
      ...initialSettings,
      dailyGoalMl: Number(dailyGoal),
      theme: preference,
    });

    if (!result.success) {
      setError('Введите цель от 250 до 10 000 мл.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await saveSettings(result.data);
      setNotification('Дневная цель сохранена.');
    } catch {
      setError('Не удалось сохранить настройки.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const profile = {
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
    };
    const recommendedGoal = calculateRecommendedGoalMl(profile);
    const result = settingsSchema.safeParse({
      ...initialSettings,
      dailyGoalMl: recommendedGoal,
      theme: preference,
      hydrationProfile: profile,
      onboardingCompleted: true,
    });

    if (!result.success) {
      setError('Проверьте рост, вес и уровень активности.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await saveSettings(result.data);
      setDailyGoal(String(recommendedGoal));
      setNotification(
        `Рекомендованная цель: ${recommendedGoal.toLocaleString('ru-RU')} мл.`,
      );
    } catch {
      setError('Не удалось сохранить параметры.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    if (
      !window.confirm(
        'Удалить всю историю и пользовательские напитки? Это действие нельзя отменить.',
      )
    ) {
      return;
    }

    try {
      setError('');
      await resetAllData();
      setPreference('system');
      setDailyGoal('2000');
      setNotification('Локальные данные сброшены.');
    } catch {
      setError('Не удалось сбросить данные.');
    }
  }

  async function handleRestoreBuiltins() {
    if (
      !window.confirm(
        'Восстановить исходные названия, порции и гидратацию всех встроенных напитков?',
      )
    ) {
      return;
    }

    try {
      setError('');
      await drinkRepository.restoreBuiltins();
      setNotification('Встроенные напитки восстановлены.');
    } catch {
      setError('Не удалось восстановить встроенные напитки.');
    }
  }

  async function handleExport() {
    try {
      setError('');
      setIsTransferring(true);
      const backup = await createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `water-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotification('Резервная копия создана.');
    } catch {
      setError('Не удалось создать резервную копию.');
    } finally {
      setIsTransferring(false);
    }
  }

  async function handleImport(file: File) {
    try {
      setError('');
      setIsTransferring(true);
      const backup = parseBackupJson(await file.text());

      if (
        !window.confirm(
          `Заменить текущие данные резервной копией от ${new Date(backup.exportedAt).toLocaleString('ru-RU')}?`,
        )
      ) {
        return;
      }

      await replaceFromBackup(backup);
      setPreference(backup.settings.theme);
      setDailyGoal(String(backup.settings.dailyGoalMl));
      setNotification('Резервная копия восстановлена.');
    } catch {
      setError(
        'Файл повреждён или имеет неподдерживаемый формат. Данные не изменены.',
      );
    } finally {
      setIsTransferring(false);
    }
  }

  return (
    <div className={styles.layout}>
      <section>
        <p className={styles.eyebrow}>Персонализация</p>
        <h1 className={styles.title}>Настройки</h1>
      </section>

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

      <Card className={styles.section}>
        <div>
          <h2>Дневная цель</h2>
          <p>Используется для прогресса на главном экране и в статистике.</p>
        </div>
        <form
          className={styles.goalForm}
          onSubmit={(event) => void handleGoalSubmit(event)}
        >
          <TextField
            inputMode="numeric"
            label="Цель, мл"
            max={10000}
            min={250}
            onChange={(event) => setDailyGoal(event.target.value)}
            required
            type="number"
            value={dailyGoal}
          />
          <Button isLoading={isSaving} type="submit">
            Сохранить цель
          </Button>
        </form>
      </Card>

      <Card className={styles.profileSection}>
        <div>
          <h2>Персональный расчёт</h2>
          <p>Обновите параметры и пересчитайте ориентировочную дневную цель.</p>
        </div>
        <form
          className={styles.profileForm}
          onSubmit={(event) => void handleProfileSubmit(event)}
        >
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
          <label className={styles.activityField}>
            <span>Активность</span>
            <select
              onChange={(event) =>
                setActivityLevel(event.target.value as ActivityLevel)
              }
              value={activityLevel}
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {ACTIVITY_LABELS[level]}
                </option>
              ))}
            </select>
          </label>
          <Button isLoading={isSaving} type="submit">
            Пересчитать цель
          </Button>
        </form>
      </Card>

      <Card className={styles.section}>
        <div>
          <h2>Тема интерфейса</h2>
          <p>Системная тема автоматически следует настройкам устройства.</p>
        </div>
        <fieldset className={styles.themePicker}>
          <legend className={styles.visuallyHidden}>Тема интерфейса</legend>
          {THEME_PREFERENCES.map((theme) => (
            <label key={theme}>
              <input
                checked={preference === theme}
                name="theme"
                onChange={() => setPreference(theme)}
                type="radio"
                value={theme}
              />
              <span>{THEME_LABELS[theme]}</span>
            </label>
          ))}
        </fieldset>
      </Card>

      <Card className={styles.linkCard}>
        <div>
          <h2>Каталог напитков</h2>
          <p>Создавайте напитки и настраивайте их порции и гидратацию.</p>
        </div>
        <Link to="/drinks">
          Управлять напитками <span aria-hidden="true">→</span>
        </Link>
      </Card>

      <Card className={styles.section}>
        <div>
          <h2>Встроенные напитки</h2>
          <p>Верните удалённые напитки и восстановите их исходные параметры.</p>
        </div>
        <Button
          onClick={() => void handleRestoreBuiltins()}
          variant="secondary"
        >
          Восстановить встроенные напитки
        </Button>
      </Card>

      <Card className={styles.section}>
        <div>
          <h2>Резервная копия</h2>
          <p>Сохраните напитки, историю и настройки в один JSON-файл.</p>
        </div>
        <div className={styles.backupActions}>
          <Button
            isLoading={isTransferring}
            onClick={() => void handleExport()}
            variant="secondary"
          >
            Экспортировать
          </Button>
          <label className={styles.importButton}>
            <span>Импортировать</span>
            <input
              accept="application/json,.json"
              disabled={isTransferring}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
                event.target.value = '';
              }}
              type="file"
            />
          </label>
        </div>
      </Card>

      <Card className={styles.section}>
        <div>
          <h2>Установка на iPhone</h2>
          <p>После публикации приложение можно запускать с домашнего экрана.</p>
        </div>
        <ol className={styles.instructions}>
          <li>Откройте приложение в Safari.</li>
          <li>Нажмите кнопку «Поделиться».</li>
          <li>Выберите «На экран „Домой“» и подтвердите добавление.</li>
        </ol>
      </Card>

      <Card className={styles.dangerSection}>
        <div>
          <h2>Сброс данных</h2>
          <p>
            Удаляет историю и пользовательские напитки только на этом
            устройстве.
          </p>
        </div>
        <Button
          className={styles.dangerButton}
          onClick={() => void handleReset()}
          variant="secondary"
        >
          Сбросить локальные данные
        </Button>
      </Card>

      <p className={styles.version}>
        Water Tracker · версия {import.meta.env.VITE_APP_VERSION ?? '0.1.0'}
      </p>
    </div>
  );
}
