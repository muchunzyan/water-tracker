import type { HTMLAttributes, PropsWithChildren } from 'react';

import styles from './Card.module.css';

type CardProps = PropsWithChildren<HTMLAttributes<HTMLElement>>;

export function Card({ children, className, ...props }: CardProps) {
  const classes = [styles.card, className].filter(Boolean).join(' ');

  return (
    <section className={classes} {...props}>
      {children}
    </section>
  );
}
