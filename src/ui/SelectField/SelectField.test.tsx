import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { SelectField } from './SelectField';

describe('SelectField', () => {
  it('связывает подпись и ошибку с выпадающим списком', () => {
    render(
      <SelectField error="Выберите напиток" label="Напиток">
        <option value="water">Вода</option>
      </SelectField>,
    );

    const select = screen.getByRole('combobox', { name: 'Напиток' });
    const error = screen.getByText('Выберите напиток');

    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', error.id);
  });

  it('передаёт выбранное значение обработчику', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SelectField
        defaultValue="water"
        label="Напиток"
        onValueChange={onValueChange}
      >
        <option value="water">Вода</option>
        <option value="tea">Чай</option>
      </SelectField>,
    );

    const select = screen.getByRole('combobox', { name: 'Напиток' });
    select.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('tea');
    expect(select).toHaveTextContent('Чай');
  });

  it('фильтрует варианты через поиск', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        defaultValue="water"
        label="Напиток"
        searchable
        searchLabel="Поиск напитка"
      >
        <option value="water">Вода</option>
        <option value="green-tea">Зелёный чай</option>
        <option value="coffee">Кофе</option>
      </SelectField>,
    );

    const select = screen.getByRole('combobox', { name: 'Напиток' });
    select.focus();
    await user.keyboard('{ArrowDown}');
    await user.type(
      screen.getByRole('searchbox', { name: 'Поиск напитка' }),
      'зеленый',
    );

    expect(
      screen.getByRole('option', { name: 'Зелёный чай' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Вода' }),
    ).not.toBeInTheDocument();
  });
});
