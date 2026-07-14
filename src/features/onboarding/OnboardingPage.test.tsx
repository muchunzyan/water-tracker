import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { OnboardingPage } from './OnboardingPage';
import { DEFAULT_SETTINGS } from '../../data/database';

const { saveSettings } = vi.hoisted(() => ({
  saveSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../data/hooks', () => ({ saveSettings }));

describe('OnboardingPage', () => {
  beforeEach(() => saveSettings.mockClear());

  it('рассчитывает цель и завершает первый запуск', async () => {
    render(<OnboardingPage settings={DEFAULT_SETTINGS} />);

    expect(screen.getByText('2 550 мл')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Сохранить и продолжить' }),
    );

    await waitFor(() =>
      expect(saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyGoalMl: 2_550,
          onboardingCompleted: true,
          hydrationProfile: {
            heightCm: 170,
            weightKg: 70,
            activityLevel: 'moderate',
          },
        }),
      ),
    );
  });
});
