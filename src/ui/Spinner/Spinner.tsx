import { Spinner as ShadcnSpinner } from '@/components/ui/spinner';
import styles from './Spinner.module.css';

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Загрузка' }: SpinnerProps) {
  return <ShadcnSpinner aria-label={label} className={styles.spinner} />;
}
