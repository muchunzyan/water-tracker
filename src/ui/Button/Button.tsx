import type { ComponentProps, ReactNode } from 'react';

import { Button as ShadcnButton } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<
  ComponentProps<typeof ShadcnButton>,
  'variant'
> {
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
  const shadcnVariant = variant === 'primary' ? 'default' : variant;

  return (
    <ShadcnButton
      className={cn(styles.button, className)}
      disabled={disabled || isLoading}
      size="lg"
      type={type}
      variant={shadcnVariant}
      {...props}
    >
      {isLoading ? <Spinner aria-hidden="true" /> : icon}
      <span>{children}</span>
    </ShadcnButton>
  );
}
