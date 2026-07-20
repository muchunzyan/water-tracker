import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import type { HydrationEntry } from '../../domain/models';
import { Card } from '../../ui/Card/Card';
import { DrinkIcon } from '../../ui/DrinkIcon/DrinkIcon';
import styles from './EntryCard.module.css';

interface EntryCardProps {
  entry: HydrationEntry;
  onDelete: (entry: HydrationEntry) => void | Promise<void>;
  onEdit: (entry: HydrationEntry) => void;
}

export function EntryCard({ entry, onDelete, onEdit }: EntryCardProps) {
  return (
    <Card className={styles.card}>
      <div
        aria-hidden="true"
        className={styles.icon}
        style={{
          backgroundColor: `${entry.drink.color}24`,
          color: entry.drink.color,
        }}
      >
        <DrinkIcon name={entry.drink.icon} size={30} />
      </div>
      <div className={styles.info}>
        <h3>{entry.drink.name}</h3>
        <p>
          <time dateTime={entry.consumedAt}>
            {format(new Date(entry.consumedAt), 'HH:mm')}
          </time>{' '}
          · {entry.effectiveHydrationMl} мл гидратации
        </p>
      </div>
      <strong className={styles.amount}>{entry.volumeMl} мл</strong>
      <div className={styles.actions}>
        <Button onClick={() => onEdit(entry)} size="sm" variant="ghost">
          Изменить
        </Button>
        <Button onClick={() => void onDelete(entry)} size="sm" variant="ghost">
          Удалить
        </Button>
      </div>
    </Card>
  );
}
