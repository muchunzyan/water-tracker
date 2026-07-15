import type { PropsWithChildren } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open={isOpen}
    >
      <DialogContent
        className={styles.sheet}
        position="custom"
        showCloseButton={false}
      >
        <div className={styles.handle} aria-hidden="true" />
        <DialogHeader className={styles.header}>
          <DialogTitle className={styles.title}>{title}</DialogTitle>
          <Button aria-label="Закрыть" onClick={onClose} variant="ghost">
            <Icon name="close" size={20} />
          </Button>
        </DialogHeader>
        <div className={styles.content}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
