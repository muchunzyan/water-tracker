import {
  Children,
  isValidElement,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
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
  searchable?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
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
  searchable = false,
  searchLabel = 'Поиск',
  searchPlaceholder = 'Найти',
  value,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const visibleOptions = normalizedQuery
    ? options.filter((option) =>
        normalizeSearchValue(getTextContent(option.props.children)).includes(
          normalizedQuery,
        ),
      )
    : options;
  const visibleValues = new Set(
    visibleOptions.map((option) => String(option.props.value ?? '')),
  );

  return (
    <Field className={styles.field} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={selectId}>{label}</FieldLabel>
      <Select
        defaultValue={defaultValue}
        disabled={disabled}
        items={items}
        name={name}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setSearchQuery('');
        }}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onValueChange?.(nextValue);
        }}
        required={required}
        open={isOpen}
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
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          header={
            searchable ? (
              <div
                className={styles.search}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <input
                  aria-label={searchLabel}
                  autoComplete="off"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => event.stopPropagation()}
                  placeholder={searchPlaceholder}
                  type="search"
                  value={searchQuery}
                />
              </div>
            ) : undefined
          }
        >
          {options.map((option) => {
            const optionValue = String(option.props.value ?? '');

            return (
              <SelectItem
                disabled={option.props.disabled}
                hidden={!visibleValues.has(optionValue)}
                key={optionValue}
                value={optionValue}
              >
                {option.props.children}
              </SelectItem>
            );
          })}
          {searchable && visibleOptions.length === 0 ? (
            <p className={styles.noResults} role="status">
              Ничего не найдено
            </p>
          ) : null}
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

function getTextContent(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? getTextContent(child.props.children)
          : '',
    )
    .join(' ');
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
