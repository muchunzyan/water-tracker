import { fireEvent, render, screen } from '@testing-library/react';
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

  it('передаёт выбранное значение обработчику', () => {
    const onChange = vi.fn();
    render(
      <SelectField label="Напиток" onChange={onChange} defaultValue="water">
        <option value="water">Вода</option>
        <option value="tea">Чай</option>
      </SelectField>,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Напиток' }), {
      target: { value: 'tea' },
    });

    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('combobox', { name: 'Напиток' })).toHaveValue(
      'tea',
    );
  });
});
