import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { AddEntrySheet } from './AddEntrySheet';

const { save, useEntriesMock } = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue(undefined),
  useEntriesMock: vi.fn<() => HydrationEntry[]>(),
}));

const tea = BUILTIN_DRINKS[1]!;
const previousEntry: HydrationEntry = {
  id: 'previous-entry',
  drinkId: tea.id,
  drink: createDrinkSnapshot(tea),
  volumeMl: 280,
  effectiveHydrationMl: 266,
  consumedAt: '2026-07-16T10:00:00.000Z',
  createdAt: '2026-07-16T10:00:00.000Z',
  updatedAt: '2026-07-16T10:00:00.000Z',
};

vi.mock('../../data/hooks', () => ({
  useDrinks: () => BUILTIN_DRINKS,
  useEntries: () => useEntriesMock(),
}));

vi.mock('../../data/repositories', () => ({
  entryRepository: { save },
}));

describe('AddEntrySheet', () => {
  beforeEach(() => {
    save.mockClear();
    useEntriesMock.mockReturnValue([]);
  });

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

  it('заполняет напиток и объём из предыдущей записи', async () => {
    useEntriesMock.mockReturnValue([previousEntry]);
    render(<AddEntrySheet onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Напиток' })).toHaveTextContent(
      'Чай · 95%',
    );
    expect(screen.getByRole('spinbutton', { name: 'Выпито, мл' })).toHaveValue(
      280,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить запись' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ drinkId: tea.id, volumeMl: 280 }),
      ),
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
