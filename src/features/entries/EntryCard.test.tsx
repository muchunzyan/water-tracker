import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { createDrinkSnapshot, type HydrationEntry } from '../../domain/models';
import { EntryCard } from './EntryCard';

const water = BUILTIN_DRINKS[0]!;
const entry: HydrationEntry = {
  id: 'entry-card',
  drinkId: water.id,
  drink: createDrinkSnapshot(water),
  volumeMl: 250,
  effectiveHydrationMl: 250,
  consumedAt: '2026-07-20T12:30:00.000Z',
  createdAt: '2026-07-20T12:30:00.000Z',
  updatedAt: '2026-07-20T12:30:00.000Z',
};

describe('EntryCard', () => {
  it('показывает иконку и данные записи и вызывает действия', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(
      <EntryCard entry={entry} onDelete={onDelete} onEdit={onEdit} />,
    );

    expect(screen.getByRole('heading', { name: 'Вода' })).toBeInTheDocument();
    expect(screen.getByText(/250 мл гидратации/)).toBeInTheDocument();
    expect(
      screen.getByText('250 мл', { selector: 'strong' }),
    ).toBeInTheDocument();
    expect(container.querySelector('.lucide-droplet')).toBeInTheDocument();

    const editButton = screen.getByRole('button', { name: 'Изменить' });
    expect(editButton).toHaveClass('bg-secondary');

    fireEvent.click(editButton);
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onEdit).toHaveBeenCalledWith(entry);
    expect(onDelete).toHaveBeenCalledWith(entry);
  });
});
