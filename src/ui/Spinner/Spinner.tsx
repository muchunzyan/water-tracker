import styles from './Spinner.module.css';

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Загрузка' }: SpinnerProps) {
  return <span aria-label={label} className={styles.spinner} role="status" />;
}
