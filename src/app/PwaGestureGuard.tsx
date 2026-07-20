import { useEffect, useState } from 'react';

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isStandaloneMode(mediaQuery: MediaQueryList) {
  return (
    mediaQuery.matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

export function PwaGestureGuard() {
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

    document.addEventListener('gesturestart', preventGesture, {
      passive: false,
    });
    document.addEventListener('gesturechange', preventGesture, {
      passive: false,
    });
    document.addEventListener('touchmove', preventMultiTouch, {
      passive: false,
    });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('touchmove', preventMultiTouch);
    };
  }, [isStandalone]);

  return null;
}
