import { useEffect, useRef } from 'react';

import { updateSettings } from '../data/hooks';
import { loadTodayWeather } from '../data/weather';
import { getLocalDateKey } from '../domain/hydration-goal';
import type { Settings } from '../domain/models';

export function DailyWeatherSync({ settings }: { settings: Settings }) {
  const attemptedDate = useRef<string | null>(null);

  useEffect(() => {
    const today = getLocalDateKey();
    if (!settings.useTemperatureAdjustment) {
      attemptedDate.current = null;
      return;
    }
    if (
      !settings.onboardingCompleted ||
      settings.weather?.date === today ||
      attemptedDate.current === today
    ) {
      return;
    }

    attemptedDate.current = today;
    void loadTodayWeather()
      .then((weather) => updateSettings({ weather }))
      .catch(() => {
        // Без прогноза приложение продолжает работать с базовой нормой.
      });
  }, [settings]);

  return null;
}
