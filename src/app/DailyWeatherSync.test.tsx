import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { DailyWeatherSync } from './DailyWeatherSync';
import { getLocalDateKey } from '../domain/hydration-goal';
import type { DailyWeather, Settings } from '../domain/models';

const { loadTodayWeather, updateSettings } = vi.hoisted(() => ({
  loadTodayWeather: vi.fn<() => Promise<DailyWeather>>(),
  updateSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../data/weather', () => ({ loadTodayWeather }));
vi.mock('../data/hooks', () => ({ updateSettings }));

const today = getLocalDateKey();
const weather: DailyWeather = {
  date: today,
  maxTemperatureC: 30,
  latitude: 55.75,
  longitude: 37.62,
  fetchedAt: new Date().toISOString(),
};
const settings: Settings = {
  version: 1,
  dailyGoalMl: 2_000,
  theme: 'system',
  onboardingCompleted: true,
  useTemperatureAdjustment: true,
};

describe('DailyWeatherSync', () => {
  beforeEach(() => {
    loadTodayWeather.mockReset();
    loadTodayWeather.mockResolvedValue(weather);
    updateSettings.mockClear();
  });

  it('загружает и сохраняет прогноз один раз за запуск', async () => {
    const view = render(<DailyWeatherSync settings={settings} />);

    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith({ weather }),
    );
    view.rerender(<DailyWeatherSync settings={settings} />);
    expect(loadTodayWeather).toHaveBeenCalledTimes(1);
  });

  it('не делает запрос, если прогноз на сегодня уже сохранён', () => {
    render(<DailyWeatherSync settings={{ ...settings, weather }} />);

    expect(loadTodayWeather).not.toHaveBeenCalled();
  });

  it('при следующем открытии повторяет неудавшуюся попытку', async () => {
    loadTodayWeather.mockRejectedValueOnce(new Error('offline'));
    const firstOpening = render(<DailyWeatherSync settings={settings} />);
    await waitFor(() => expect(loadTodayWeather).toHaveBeenCalledTimes(1));
    firstOpening.unmount();

    render(<DailyWeatherSync settings={settings} />);
    await waitFor(() => expect(loadTodayWeather).toHaveBeenCalledTimes(2));
  });
});
