import { type InputHTMLAttributes, useId } from 'react';

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
  const description = error ?? hint;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const classes = [styles.input, error && styles.invalid, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={classes}
        id={inputId}
        {...props}
      />
      {description ? (
        <span className={error ? styles.error : styles.hint} id={descriptionId}>
          {description}
        </span>
      ) : null}
    </div>
  );
}
