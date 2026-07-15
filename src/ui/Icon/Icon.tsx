import {
  CupSoda,
  Droplet,
  History,
  House,
  Moon,
  Plus,
  Settings,
  Sun,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export type IconName =
  | 'add'
  | 'close'
  | 'drinks'
  | 'droplet'
  | 'history'
  | 'home'
  | 'moon'
  | 'settings'
  | 'sun';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number;
}

const icons: Record<IconName, LucideIcon> = {
  add: Plus,
  close: X,
  drinks: CupSoda,
  droplet: Droplet,
  history: History,
  home: House,
  moon: Moon,
  settings: Settings,
  sun: Sun,
};

export function Icon({ name, size = 24, ...props }: IconProps) {
  const LucideIconComponent = icons[name];

  return <LucideIconComponent aria-hidden="true" size={size} {...props} />;
}
