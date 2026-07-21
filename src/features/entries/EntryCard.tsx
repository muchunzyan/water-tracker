import { format } from 'date-fns';

import type { HydrationEntry } from '../../domain/models';
import { DrinkCard } from '../../ui/DrinkCard/DrinkCard';

interface EntryCardProps {
  entry: HydrationEntry;
  onDelete: (entry: HydrationEntry) => void | Promise<void>;
  onEdit: (entry: HydrationEntry) => void;
}

export function EntryCard({ entry, onDelete, onEdit }: EntryCardProps) {
  return (
    <DrinkCard
      details={
        <>
          <time dateTime={entry.consumedAt}>
            {format(new Date(entry.consumedAt), 'HH:mm')}
          </time>{' '}
          · {entry.effectiveHydrationMl} мл гидратации
        </>
      }
      drink={entry.drink}
      headingLevel={3}
      onDelete={() => onDelete(entry)}
      onEdit={() => onEdit(entry)}
      trailing={`${entry.volumeMl} мл`}
    />
  );
}
