import { useMemo, useState, type FormEvent } from 'react';

import { useDrinks } from '../../data/hooks';
import { drinkRepository } from '../../data/repositories';
import {
  DRINK_ICONS,
  drinkSchema,
  type Drink,
  type DrinkIcon,
} from '../../domain/models';
import { BottomSheet } from '../../ui/BottomSheet/BottomSheet';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { Icon } from '../../ui/Icon/Icon';
import { Spinner } from '../../ui/Spinner/Spinner';
import { SelectField } from '../../ui/SelectField/SelectField';
import { TextField } from '../../ui/TextField/TextField';
import styles from './DrinksPage.module.css';
import { filterDrinks } from './filter-drinks';
import {
  SORT_MODES,
  SORT_STORAGE_KEY,
  sortDrinks,
  type SortMode,
} from './sort-drinks';

const ICON_LABELS: Record<DrinkIcon, string> = {
  water: 'Вода',
  tea: 'Чай',
  coffee: 'Кофе',
  milk: 'Молоко',
  juice: 'Сок',
  soda: 'Газировка',
  custom: 'Другой напиток',
};

const ICON_SYMBOLS: Record<DrinkIcon, string> = {
  water: '💧',
  tea: '🍵',
  coffee: '☕',
  milk: '🥛',
  juice: '🍊',
  soda: '🥤',
  custom: '🫗',
};

export function DrinksPage() {
  const drinks = useDrinks();
  const [editingDrink, setEditingDrink] = useState<Drink | null>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>(() => getStoredSortMode());
  const sortedDrinks = useMemo(
    () => sortDrinks(filterDrinks(drinks ?? [], searchQuery), sortMode),
    [drinks, searchQuery, sortMode],
  );

  function handleSortChange(value: SortMode) {
    setSortMode(value);
    window.localStorage.setItem(SORT_STORAGE_KEY, value);
  }

  return (
    <div className={styles.layout}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Каталог</p>
          <h1 className={styles.title}>Напитки</h1>
          <p className={styles.description}>
            Настройте порции и гидратацию напитков, которые вы пьёте чаще всего.
          </p>
        </div>
        <Button
          icon={<Icon name="add" size={20} />}
          onClick={() => setEditingDrink(null)}
        >
          Новый напиток
        </Button>
      </section>

      {drinks !== undefined && drinks.length > 0 ? (
        <div className={styles.catalogToolbar}>
          <div className={styles.searchControl}>
            <TextField
              autoComplete="off"
              label="Поиск"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Название напитка"
              type="search"
              value={searchQuery}
            />
            {searchQuery && sortedDrinks.length > 0 ? (
              <Button onClick={() => setSearchQuery('')} variant="ghost">
                Очистить поиск
              </Button>
            ) : null}
          </div>
          <SelectField
            aria-label="Сортировка напитков"
            label="Сортировка"
            onValueChange={(value) => handleSortChange(value as SortMode)}
            value={sortMode}
          >
            <option value="name-asc">По алфавиту: А–Я</option>
            <option value="name-desc">По алфавиту: Я–А</option>
            <option value="hydration-desc">Гидратация: сначала выше</option>
            <option value="hydration-asc">Гидратация: сначала ниже</option>
          </SelectField>
        </div>
      ) : null}

      {drinks === undefined ? (
        <Card className={styles.loading}>
          <Spinner label="Загружаем напитки" />
        </Card>
      ) : drinks.length === 0 ? (
        <Card>
          <EmptyState
            action={
              <Button onClick={() => setEditingDrink(null)}>
                Создать напиток
              </Button>
            }
            description="Создайте первый напиток и задайте его процент гидратации."
            icon={<Icon name="drinks" size={28} />}
            title="Каталог пуст"
          />
        </Card>
      ) : sortedDrinks.length === 0 ? (
        <Card>
          <EmptyState
            action={
              <Button onClick={() => setSearchQuery('')} variant="secondary">
                Очистить поиск
              </Button>
            }
            description={`По запросу «${searchQuery.trim()}» ничего не найдено.`}
            icon={<Icon name="drinks" size={28} />}
            title="Напитки не найдены"
          />
        </Card>
      ) : (
        <div className={styles.grid}>
          {sortedDrinks.map((drink) => (
            <DrinkCard drink={drink} key={drink.id} onEdit={setEditingDrink} />
          ))}
        </div>
      )}

      {editingDrink !== undefined ? (
        <DrinkEditor
          drink={editingDrink}
          key={editingDrink?.id ?? 'new'}
          onClose={() => setEditingDrink(undefined)}
        />
      ) : null}
    </div>
  );
}

function DrinkCard({
  drink,
  onEdit,
}: {
  drink: Drink;
  onEdit: (drink: Drink) => void;
}) {
  const [error, setError] = useState('');

  async function handleDelete() {
    if (
      !window.confirm(
        `Удалить напиток «${drink.name}»? История останется доступна.`,
      )
    ) {
      return;
    }

    try {
      setError('');
      await drinkRepository.delete(drink.id);
    } catch {
      setError('Не удалось удалить напиток. Попробуйте ещё раз.');
    }
  }

  return (
    <Card className={styles.drinkCard}>
      <div
        aria-hidden="true"
        className={styles.drinkIcon}
        style={{ backgroundColor: `${drink.color}24`, color: drink.color }}
      >
        {ICON_SYMBOLS[drink.icon]}
      </div>
      <div className={styles.drinkInfo}>
        <div className={styles.drinkTitleRow}>
          <h2>{drink.name}</h2>
          {drink.isBuiltin ? (
            <span className={styles.badge}>Встроенный</span>
          ) : null}
        </div>
        <p>
          {drink.hydrationPercent}% гидратации · {drink.standardVolumeMl} мл
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
      <div className={styles.actions}>
        <Button onClick={() => onEdit(drink)} variant="secondary">
          Изменить
        </Button>
        <Button onClick={() => void handleDelete()} variant="ghost">
          Удалить
        </Button>
      </div>
    </Card>
  );
}

function DrinkEditor({
  drink,
  onClose,
}: {
  drink: Drink | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(drink?.name ?? '');
  const [hydrationPercent, setHydrationPercent] = useState(
    String(drink?.hydrationPercent ?? 100),
  );
  const [standardVolumeMl, setStandardVolumeMl] = useState(
    String(drink?.standardVolumeMl ?? 250),
  );
  const [color, setColor] = useState(drink?.color ?? '#39BFC0');
  const [icon, setIcon] = useState<DrinkIcon>(drink?.icon ?? 'custom');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = new Date().toISOString();
    const candidate = {
      id: drink?.id ?? crypto.randomUUID(),
      name,
      hydrationPercent: Number(hydrationPercent),
      standardVolumeMl: Number(standardVolumeMl),
      color,
      icon,
      isBuiltin: drink?.isBuiltin ?? false,
      createdAt: drink?.createdAt ?? now,
      updatedAt: now,
    };
    const result = drinkSchema.safeParse(candidate);

    if (!result.success) {
      setError(
        result.error.issues[0]?.message ?? 'Проверьте заполненные поля.',
      );
      return;
    }

    try {
      setError('');
      setIsSaving(true);
      await drinkRepository.save(result.data);
      onClose();
    } catch {
      setError('Не удалось сохранить напиток. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={drink ? 'Изменить напиток' : 'Новый напиток'}
    >
      <form
        className={styles.form}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <TextField
          autoComplete="off"
          label="Название"
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="Например, какао"
          required
          value={name}
        />
        <div className={styles.formRow}>
          <TextField
            inputMode="numeric"
            label="Гидратация, %"
            max={100}
            min={0}
            onChange={(event) => setHydrationPercent(event.target.value)}
            required
            type="number"
            value={hydrationPercent}
          />
          <TextField
            inputMode="numeric"
            label="Стандартная порция, мл"
            max={2000}
            min={50}
            onChange={(event) => setStandardVolumeMl(event.target.value)}
            required
            type="number"
            value={standardVolumeMl}
          />
        </div>
        <div className={styles.formRow}>
          <SelectField
            label="Иконка"
            value={icon}
            onValueChange={(value) => setIcon(value as DrinkIcon)}
          >
            {DRINK_ICONS.map((value) => (
              <option key={value} value={value}>
                {ICON_SYMBOLS[value]} {ICON_LABELS[value]}
              </option>
            ))}
          </SelectField>
          <TextField
            className={styles.colorInput}
            label="Цвет"
            onChange={(event) => setColor(event.target.value.toUpperCase())}
            type="color"
            value={color}
          />
        </div>
        {error ? (
          <p aria-live="polite" className={styles.formError} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.formActions}>
          <Button onClick={onClose} variant="ghost">
            Отмена
          </Button>
          <Button isLoading={isSaving} type="submit">
            {drink ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}

function getStoredSortMode(): SortMode {
  const stored = window.localStorage.getItem(SORT_STORAGE_KEY);
  return SORT_MODES.includes(stored as SortMode)
    ? (stored as SortMode)
    : 'name-asc';
}
