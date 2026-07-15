import type { PropsWithChildren, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { Icon, type IconName } from '../ui/Icon/Icon';

import styles from './AppShell.module.css';

interface AppShellProps extends PropsWithChildren {
  actions?: ReactNode;
}

const navigation: { icon: IconName; label: string; to: string }[] = [
  { icon: 'home', label: 'Сегодня', to: '/' },
  { icon: 'history', label: 'История', to: '/history' },
  { icon: 'drinks', label: 'Напитки', to: '/drinks' },
  { icon: 'settings', label: 'Настройки', to: '/settings' },
];

export function AppShell({ actions, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        Перейти к содержанию
      </a>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <img alt="" src={`${import.meta.env.BASE_URL}icon.svg`} />
          </span>
          <span>Oasis — Water Tracker</span>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={styles.body}>
        <nav aria-label="Основная навигация" className={styles.navigation}>
          {navigation.map(({ icon, label, to }) => (
            <NavLink
              className={({ isActive }) =>
                `${styles.navigationLink} ${isActive ? styles.active : ''}`
              }
              end={to === '/'}
              key={to}
              to={to}
            >
              <Icon name={icon} size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <main className={styles.main} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
