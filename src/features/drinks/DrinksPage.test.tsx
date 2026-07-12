import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  });

  it('показывает встроенные напитки без действий изменения', () => {
    render(<DrinksPage />);

    expect(screen.getByRole('heading', { name: 'Вода' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Изменить' }),
    ).not.toBeInTheDocument();
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
});
