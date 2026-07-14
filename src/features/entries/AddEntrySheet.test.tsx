import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { AddEntrySheet } from './AddEntrySheet';

const { save } = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../data/hooks', () => ({
  useDrinks: () => BUILTIN_DRINKS,
  useEntries: () => [],
}));

vi.mock('../../data/repositories', () => ({
  entryRepository: { save },
}));

describe('AddEntrySheet', () => {
  beforeEach(() => save.mockClear());

  it('показывает предварительный расчёт и сохраняет запись', async () => {
    const onSaved = vi.fn();
    render(<AddEntrySheet onClose={vi.fn()} onSaved={onSaved} />);

    expect(
      screen.getByText('250 мл', { selector: 'strong' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '330 мл' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить запись' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          drinkId: 'builtin-water',
          volumeMl: 330,
          effectiveHydrationMl: 330,
        }),
      ),
    );
    expect(onSaved).toHaveBeenCalledWith(
      expect.stringContaining('добавлено 330 мл'),
    );
  });

  it('не позволяет сохранить чрезмерно большой объём', () => {
    render(<AddEntrySheet onClose={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Выпито, мл' }), {
      target: { value: '6000' },
    });

    expect(
      screen.getByRole('button', { name: 'Сохранить запись' }),
    ).toBeDisabled();
    expect(screen.getByText('От 1 до 5 000 мл')).toBeInTheDocument();
  });
});
