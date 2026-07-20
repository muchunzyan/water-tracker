import { render } from '@testing-library/react';

import { PwaGestureGuard } from './PwaGestureGuard';

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

describe('PwaGestureGuard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('pwa-standalone');
  });

  it('не ограничивает жесты в обычной вкладке браузера', () => {
    mockStandaloneMode(false);

    render(<PwaGestureGuard />);

    expect(document.documentElement).not.toHaveClass('pwa-standalone');

    const gesture = new Event('gesturestart', { cancelable: true });
    expect(document.dispatchEvent(gesture)).toBe(true);
  });

  it('защищает PWA от масштабирования без блокировки ориентации', () => {
    mockStandaloneMode(true);

    render(<PwaGestureGuard />);

    expect(document.documentElement).toHaveClass('pwa-standalone');

    const gesture = new Event('gesturestart', { cancelable: true });
    expect(document.dispatchEvent(gesture)).toBe(false);
  });
});
