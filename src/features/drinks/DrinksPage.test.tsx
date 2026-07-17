import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { DrinksPage } from './DrinksPage';

const { save } = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../data/hooks', () => ({
  useDrinks: () => BUILTIN_DRINKS,
}));

vi.mock('../../data/repositories', () => ({
  drinkRepository: {
    save,
    delete: vi.fn().mockResolvedValue(true),
  },
}));

describe('DrinksPage', () => {
  beforeEach(() => {
    save.mockClear();
    window.localStorage.clear();
  });

  it('позволяет изменять встроенные напитки', () => {
    render(<DrinksPage />);

    expect(screen.getByRole('heading', { name: 'Вода' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Изменить' })).toHaveLength(
      BUILTIN_DRINKS.length,
    );
  });

  it('сортирует напитки по гидратации', async () => {
    const user = userEvent.setup();
    render(<DrinksPage />);

    await user.click(
      screen.getByRole('combobox', { name: 'Сортировка напитков' }),
    );
    await user.click(
      screen.getByRole('option', { name: 'Гидратация: сначала ниже' }),
    );

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings[0]).toHaveTextContent('Крепкий алкоголь');
  });

  it('фильтрует каталог по названию и очищает запрос', () => {
    render(<DrinksPage />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Поиск' }), {
      target: { value: 'зеленый' },
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Зелёный чай' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: /^Вода$/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Очистить поиск' }));
    expect(
      screen.getByRole('heading', { level: 2, name: /^Вода$/ }),
    ).toBeInTheDocument();
  });

  it('создаёт пользовательский напиток через форму', async () => {
    render(<DrinksPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Новый напиток' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Название' }), {
      target: { value: 'Какао' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Какао',
          hydrationPercent: 100,
          standardVolumeMl: 250,
          isBuiltin: false,
        }),
      ),
    );
  });

  it('выбирает иконку в визуальной сетке без текстовых подписей', async () => {
    render(<DrinksPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Новый напиток' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Название' }), {
      target: { value: 'Изотоник' },
    });
    const energyIcon = screen.getByRole('button', { name: 'Энергетик' });
    expect(energyIcon).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('Энергетик')).not.toBeInTheDocument();
    fireEvent.click(energyIcon);
    expect(energyIcon).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Изотоник', icon: 'energy' }),
      ),
    );
  });
});
