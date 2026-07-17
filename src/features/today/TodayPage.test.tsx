import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { TodayPage } from './TodayPage';

const { useEntriesBetweenMock } = vi.hoisted(() => ({
  useEntriesBetweenMock: vi.fn<() => HydrationEntry[]>(),
}));

const water = BUILTIN_DRINKS[0]!;
const entry: HydrationEntry = {
  id: 'entry-today',
  drinkId: water.id,
  drink: createDrinkSnapshot(water),
  volumeMl: 500,
  effectiveHydrationMl: 500,
  consumedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const goalEntry: HydrationEntry = {
  ...entry,
  id: 'entry-goal',
  volumeMl: 1_500,
  effectiveHydrationMl: 1_500,
};

vi.mock('../../data/hooks', () => ({
  useEntriesBetween: () => useEntriesBetweenMock(),
  useEntries: () => useEntriesBetweenMock(),
  useSettings: () => ({ version: 1, dailyGoalMl: 2_000, theme: 'system' }),
  useDrinks: () => BUILTIN_DRINKS,
}));

vi.mock('../../data/repositories', () => ({
  entryRepository: {
    delete: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('TodayPage', () => {
  beforeEach(() => useEntriesBetweenMock.mockReturnValue([entry]));

  it('рассчитывает дневной прогресс и показывает записи', () => {
    render(<TodayPage />);

    expect(
      screen.getByRole('img', { name: 'Выполнено 25% дневной цели' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/500 из 2.000 мл/)).toBeInTheDocument();
    expect(screen.getByText('Осталось 1 500 мл')).toBeInTheDocument();
    expect(screen.getByText('Серия: 0 дней')).toBeInTheDocument();
    expect(screen.getByLabelText('Записей за сегодня: 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Добавить запись' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Вода' })).toBeInTheDocument();
  });

  it('запускает анимацию при переходе через дневную цель', async () => {
    const { rerender } = render(<TodayPage />);

    expect(screen.queryByTestId('goal-celebration')).not.toBeInTheDocument();
    useEntriesBetweenMock.mockReturnValue([entry, goalEntry]);
    rerender(<TodayPage />);

    expect(await screen.findByTestId('goal-celebration')).toBeInTheDocument();
    expect(screen.getByText('Цель выполнена')).toBeInTheDocument();
  });
});
