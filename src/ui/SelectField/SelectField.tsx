import { type SelectHTMLAttributes, useId } from 'react';

import styles from './SelectField.module.css';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | undefined;
  hint?: string | undefined;
  label: string;
}

export function SelectField({
  children,
  className,
  error,
  hint,
  id,
  label,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const description = error ?? hint;
  const descriptionId = description ? `${selectId}-description` : undefined;
  const classes = [styles.select, error && styles.invalid, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={classes}
        id={selectId}
        {...props}
      >
        {children}
      </select>
      {description ? (
        <span className={error ? styles.error : styles.hint} id={descriptionId}>
          {description}
        </span>
      ) : null}
    </div>
  );
}
