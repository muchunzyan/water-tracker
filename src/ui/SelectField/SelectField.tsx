import {
  Children,
  isValidElement,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
  useId,
} from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import styles from './SelectField.module.css';

type OptionElement = ReactElement<
  OptionHTMLAttributes<HTMLOptionElement>,
  'option'
>;

interface SelectFieldProps {
  'aria-label'?: string;
  children: ReactNode;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  label: string;
  name?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  value?: string;
}

export function SelectField({
  'aria-label': ariaLabel,
  children,
  className,
  defaultValue,
  disabled,
  error,
  hint,
  id,
  label,
  name,
  onValueChange,
  required,
  value,
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = error || hint ? `${selectId}-description` : undefined;
  const options = Children.toArray(children).filter(
    (child): child is OptionElement =>
      isValidElement<OptionHTMLAttributes<HTMLOptionElement>>(child) &&
      child.type === 'option',
  );
  const items = options.map((option) => ({
    label: option.props.children,
    value: String(option.props.value ?? ''),
  }));

  return (
    <Field className={styles.field} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={selectId}>{label}</FieldLabel>
      <Select
        defaultValue={defaultValue}
        disabled={disabled}
        items={items}
        name={name}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onValueChange?.(nextValue);
        }}
        required={required}
        value={value}
      >
        <SelectTrigger
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          aria-label={ariaLabel}
          className={cn(styles.trigger, className)}
          id={selectId}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {options.map((option) => {
            const optionValue = String(option.props.value ?? '');

            return (
              <SelectItem
                disabled={option.props.disabled}
                key={optionValue}
                value={optionValue}
              >
                {option.props.children}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error ? (
        <FieldError id={descriptionId}>{error}</FieldError>
      ) : hint ? (
        <FieldDescription id={descriptionId}>{hint}</FieldDescription>
      ) : null}
    </Field>
  );
}
