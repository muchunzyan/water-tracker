import { type InputHTMLAttributes, useId } from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import styles from './TextField.module.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | undefined;
  hint?: string | undefined;
  label: string;
}

export function TextField({
  className,
  error,
  hint,
  id,
  label,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error || hint ? `${inputId}-description` : undefined;
  return (
    <Field className={styles.field} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={cn(styles.input, className)}
        id={inputId}
        {...props}
      />
      {error ? (
        <FieldError id={descriptionId}>{error}</FieldError>
      ) : hint ? (
        <FieldDescription id={descriptionId}>{hint}</FieldDescription>
      ) : null}
    </Field>
  );
}
