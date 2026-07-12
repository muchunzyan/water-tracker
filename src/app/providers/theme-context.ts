import { createContext, useContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }

  return context;
}
