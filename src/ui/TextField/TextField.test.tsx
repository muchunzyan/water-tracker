import { render, screen } from '@testing-library/react';

import { TextField } from './TextField';

describe('TextField', () => {
  it('связывает ошибку с полем ввода', () => {
    render(<TextField error="Введите объём" label="Объём" />);

    const input = screen.getByRole('textbox', { name: 'Объём' });
    const error = screen.getByText('Введите объём');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', error.id);
  });
});
