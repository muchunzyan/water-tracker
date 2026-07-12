import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { App } from './App';
import { ThemeProvider } from './providers/ThemeProvider';

function renderApp() {
  return render(
    <MemoryRouter>
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
      screen.getByRole('button', { name: 'Добавить напиток' }),
    ).toBeEnabled();
  });

  it('переходит между основными разделами', async () => {
    renderApp();

    fireEvent.click(screen.getByRole('link', { name: 'История' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'История' }),
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
