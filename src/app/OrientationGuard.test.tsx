import { render, screen } from '@testing-library/react';

import { OrientationGuard } from './OrientationGuard';

function mockStandaloneMode(matches: boolean) {
  const mediaQuery = {
    matches,
    media: '(display-mode: standalone)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQuery),
  );
  Object.defineProperty(navigator, 'standalone', {
    configurable: true,
    value: false,
  });
}

describe('OrientationGuard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('pwa-standalone');
  });

  it('не отображается в обычной вкладке браузера', () => {
    mockStandaloneMode(false);

    render(<OrientationGuard />);

    expect(screen.queryByTestId('orientation-guard')).not.toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass('pwa-standalone');
  });

  it('в PWA включает защиту от масштабирования и портретный fallback', () => {
    mockStandaloneMode(true);

    render(<OrientationGuard />);

    expect(screen.getByTestId('orientation-guard')).toHaveTextContent(
      'Поверните телефон',
    );
    expect(document.documentElement).toHaveClass('pwa-standalone');

    const gesture = new Event('gesturestart', { cancelable: true });
    expect(document.dispatchEvent(gesture)).toBe(false);
  });
});
