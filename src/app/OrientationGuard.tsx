import { useEffect, useState } from 'react';

import { Icon } from '../ui/Icon/Icon';
import styles from './OrientationGuard.module.css';

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isStandaloneMode(mediaQuery: MediaQueryList) {
  return (
    mediaQuery.matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

async function requestPortraitOrientationLock() {
  try {
    await screen.orientation.lock?.('portrait-primary');
  } catch {
    // iOS may reject orientation locking. The landscape guard remains as fallback.
  }
}

export function OrientationGuard() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const updateStandaloneMode = () => {
      const nextIsStandalone = isStandaloneMode(standaloneQuery);
      setIsStandalone(nextIsStandalone);
      document.documentElement.classList.toggle(
        'pwa-standalone',
        nextIsStandalone,
      );

      if (nextIsStandalone) void requestPortraitOrientationLock();
    };

    updateStandaloneMode();
    standaloneQuery.addEventListener('change', updateStandaloneMode);

    return () => {
      standaloneQuery.removeEventListener('change', updateStandaloneMode);
      document.documentElement.classList.remove('pwa-standalone');
    };
  }, []);

  useEffect(() => {
    if (!isStandalone) return;

    const preventGesture = (event: Event) => event.preventDefault();
    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    const restorePortrait = () => {
      if (document.visibilityState === 'visible') {
        void requestPortraitOrientationLock();
      }
    };

    document.addEventListener('gesturestart', preventGesture, {
      passive: false,
    });
    document.addEventListener('gesturechange', preventGesture, {
      passive: false,
    });
    document.addEventListener('touchmove', preventMultiTouch, {
      passive: false,
    });
    document.addEventListener('visibilitychange', restorePortrait);
    window.addEventListener('orientationchange', restorePortrait);

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('touchmove', preventMultiTouch);
      document.removeEventListener('visibilitychange', restorePortrait);
      window.removeEventListener('orientationchange', restorePortrait);
    };
  }, [isStandalone]);

  if (!isStandalone) return null;

  return (
    <aside
      aria-live="polite"
      className={styles.guard}
      data-testid="orientation-guard"
    >
      <div className={styles.content}>
        <Icon className={styles.icon} name="portrait" size={48} />
        <h2 className={styles.title}>Поверните телефон</h2>
        <p className={styles.description}>
          Oasis работает в вертикальном режиме
        </p>
      </div>
    </aside>
  );
}
