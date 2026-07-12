import { type PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { settingsRepository } from '../../data/repositories';
import {
  type ResolvedTheme,
  ThemeContext,
  type ThemePreference,
} from './theme-context';

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const resolvedTheme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    let isActive = true;

    void settingsRepository
      .get()
      .then((settings) => {
        if (isActive) setPreference(settings.theme);
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');

    if (!media) return;

    const handleChange = () => setSystemTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo(() => {
    const updatePreference = (nextPreference: ThemePreference) => {
      setPreference(nextPreference);
      void settingsRepository
        .get()
        .then((settings) =>
          settingsRepository.save({ ...settings, theme: nextPreference }),
        )
        .catch(() => undefined);
    };

    return { preference, resolvedTheme, setPreference: updatePreference };
  }, [preference, resolvedTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
