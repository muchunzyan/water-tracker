import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './AppShell';
import { useTheme } from './providers/theme-context';
import { TodayPage } from '../features/today/TodayPage';
import { Button } from '../ui/Button/Button';
import { Card } from '../ui/Card/Card';
import { Icon } from '../ui/Icon/Icon';
import { Spinner } from '../ui/Spinner/Spinner';
import styles from './App.module.css';

const DrinksPage = lazy(() =>
  import('../features/drinks/DrinksPage').then((module) => ({
    default: module.DrinksPage,
  })),
);
const HistoryPage = lazy(() =>
  import('../features/history/HistoryPage').then((module) => ({
    default: module.HistoryPage,
  })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
);

export function App() {
  const { resolvedTheme, setPreference } = useTheme();
  const nextTheme = resolvedTheme === 'light' ? 'dark' : 'light';

  return (
    <AppShell
      actions={
        <Button
          aria-label={`Включить ${nextTheme === 'dark' ? 'тёмную' : 'светлую'} тему`}
          onClick={() => setPreference(nextTheme)}
          variant="ghost"
        >
          <Icon name={resolvedTheme === 'light' ? 'moon' : 'sun'} size={20} />
        </Button>
      }
    >
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/drinks" element={<DrinksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

function PageLoader() {
  return (
    <Card className={styles.pageLoader}>
      <Spinner label="Загружаем раздел" />
    </Card>
  );
}
