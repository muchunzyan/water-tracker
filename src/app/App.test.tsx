import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { App } from './App';
import { ThemeProvider } from './providers/ThemeProvider';
import { BUILTIN_DRINKS } from '../domain/builtin-drinks';

vi.mock('../data/hooks', () => ({
  useSettings: () => ({
    version: 1,
    dailyGoalMl: 2_000,
    theme: 'system',
    onboardingCompleted: true,
  }),
  useEntriesBetween: () => [],
  useEntries: () => [],
  useDrinks: () => BUILTIN_DRINKS,
}));

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('показывает стартовое состояние текущего дня', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: /^Добр/ })).toBeInTheDocument();
    expect(screen.getByText(/0 из 2.000 мл/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Добавить запись' }),
    ).toBeEnabled();
  });

  it('открывает основной раздел по прямому маршруту', async () => {
    renderApp('/history');

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'История' },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
  });

  it('переключает тему', () => {
    renderApp();

    fireEvent.click(
      screen.getByRole('button', { name: 'Включить тёмную тему' }),
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
