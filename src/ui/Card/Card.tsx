import type { ComponentProps } from 'react';

import { Card as ShadcnCard } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import styles from './Card.module.css';

type CardProps = ComponentProps<typeof ShadcnCard>;

export function Card({ children, className, ...props }: CardProps) {
  return (
    <ShadcnCard className={cn(styles.card, className)} {...props}>
      {children}
    </ShadcnCard>
  );
}
