import { render, screen } from '@testing-library/react';

import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('не наследует центрирование обычного диалога', () => {
    render(
      <BottomSheet isOpen onClose={() => undefined} title="Новая запись">
        Содержимое
      </BottomSheet>,
    );

    const dialog = screen.getByRole('dialog');

    expect(dialog).not.toHaveClass('left-1/2');
    expect(dialog).not.toHaveClass('-translate-x-1/2');
  });
});
