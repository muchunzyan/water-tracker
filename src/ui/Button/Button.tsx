import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  isLoading?: boolean;
  variant?: ButtonVariant;
}

export function Button({
  children,
  className,
  disabled,
  icon,
  isLoading = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
}
