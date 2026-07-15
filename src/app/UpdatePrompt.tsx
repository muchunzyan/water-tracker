import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button } from '../ui/Button/Button';
import styles from './UpdatePrompt.module.css';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh && !offlineReady) return null;

  return (
    <aside aria-live="polite" className={styles.prompt}>
      <div>
        <strong>
          {needRefresh
            ? 'Доступна новая версия'
            : 'Приложение готово к работе без сети'}
        </strong>
        <p>
          {needRefresh
            ? 'Обновите приложение, чтобы получить последние изменения'
            : 'Данные продолжат храниться локально на устройстве'}
        </p>
      </div>
      <div className={styles.actions}>
        <Button
          onClick={() => {
            setNeedRefresh(false);
            setOfflineReady(false);
          }}
          variant="ghost"
        >
          Закрыть
        </Button>
        {needRefresh ? (
          <Button onClick={() => void updateServiceWorker(true)}>
            Обновить
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
