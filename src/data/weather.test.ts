import { loadTodayWeather } from './weather';

describe('loadTodayWeather', () => {
  const originalGeolocation = navigator.geolocation;

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation,
    });
  });

  it('загружает максимальную температуру на сегодня для текущей локации', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((resolve: PositionCallback) =>
          resolve({
            coords: { latitude: 55.75, longitude: 37.62 },
          } as GeolocationPosition),
        ),
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            daily: {
              time: ['2026-07-21'],
              temperature_2m_max: [31.4],
            },
          }),
      }),
    );

    await expect(loadTodayWeather()).resolves.toMatchObject({
      date: '2026-07-21',
      maxTemperatureC: 31.4,
      latitude: 55.75,
      longitude: 37.62,
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('daily=temperature_2m_max'),
    );
  });

  it('отклоняет запрос без геолокации, чтобы приложение сохранило базовую норму', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });

    await expect(loadTodayWeather()).rejects.toThrow('Геолокация недоступна');
  });
});
