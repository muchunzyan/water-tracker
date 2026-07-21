import { z } from 'zod';

import { dailyWeatherSchema, type DailyWeather } from '../domain/models';
import { getLocalDateKey } from '../domain/hydration-goal';

const openMeteoResponseSchema = z.object({
  daily: z.object({
    time: z.array(z.iso.date()).min(1),
    temperature_2m_max: z.array(z.number()).min(1),
  }),
});

export async function loadTodayWeather(): Promise<DailyWeather> {
  const position = await getCurrentPosition();
  const { latitude, longitude } = position.coords;
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'temperature_2m_max',
    forecast_days: '1',
    timezone: 'auto',
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${query.toString()}`,
  );

  if (!response.ok) throw new Error('Не удалось загрузить прогноз');

  const payload = openMeteoResponseSchema.parse(await response.json());

  return dailyWeatherSchema.parse({
    date: payload.daily.time[0] ?? getLocalDateKey(),
    maxTemperatureC: payload.daily.temperature_2m_max[0],
    latitude,
    longitude,
    fetchedAt: new Date().toISOString(),
  });
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация недоступна'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 12 * 60 * 60 * 1_000,
      timeout: 10_000,
    });
  });
}
