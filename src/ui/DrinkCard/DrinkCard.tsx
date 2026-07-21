import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { DrinkSnapshot } from '../../domain/models';
import { Card } from '../Card/Card';
import { DrinkIcon } from '../DrinkIcon/DrinkIcon';
import styles from './DrinkCard.module.css';

interface DrinkCardProps {
  badge?: string | undefined;
  details: ReactNode;
  drink: DrinkSnapshot;
  error?: string;
  headingLevel: 2 | 3;
  onDelete: () => void | Promise<void>;
  onEdit: () => void;
  trailing?: ReactNode;
}

export function DrinkCard({
  badge,
  details,
  drink,
  error,
  headingLevel,
  onDelete,
  onEdit,
  trailing,
}: DrinkCardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <Card className={`${styles.card} ${trailing ? styles.withTrailing : ''}`}>
      <div
        aria-hidden="true"
        className={styles.icon}
        style={{
          backgroundColor: `${drink.color}24`,
          color: drink.color,
        }}
      >
        <DrinkIcon name={drink.icon} size={30} />
      </div>
      <div className={styles.info}>
        <Heading>{drink.name}</Heading>
        <div className={styles.detailsRow}>
          <p>{details}</p>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
      {trailing ? (
        <strong className={styles.trailing}>{trailing}</strong>
      ) : null}
      <div className={styles.actions}>
        <Button onClick={onEdit} size="lg" variant="secondary">
          Изменить
        </Button>
        <Button onClick={() => void onDelete()} size="lg" variant="ghost">
          Удалить
        </Button>
      </div>
    </Card>
  );
}
