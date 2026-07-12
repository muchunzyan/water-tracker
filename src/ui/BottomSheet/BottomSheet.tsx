import { type PropsWithChildren, useEffect, useId, useRef } from 'react';

import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import styles from './BottomSheet.module.css';

interface BottomSheetProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function BottomSheet({
  children,
  isOpen,
  onClose,
  title,
}: BottomSheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      aria-labelledby={titleId}
      className={styles.dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      ref={dialogRef}
    >
      <section className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />
        <header className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <Button aria-label="Закрыть" onClick={onClose} variant="ghost">
            <Icon name="close" size={20} />
          </Button>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </dialog>
  );
}
