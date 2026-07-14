import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { TodayPage } from './TodayPage';

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

vi.mock('../../data/hooks', () => ({
  useEntriesBetween: () => [entry],
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
  it('рассчитывает дневной прогресс и показывает записи', () => {
    render(<TodayPage />);

    expect(
      screen.getByRole('img', { name: 'Выполнено 25% дневной цели' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/500 из 2.000 мл/)).toBeInTheDocument();
    expect(screen.getByText('Осталось 1 500 мл')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Добавить запись' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Вода' })).toBeInTheDocument();
  });
});
