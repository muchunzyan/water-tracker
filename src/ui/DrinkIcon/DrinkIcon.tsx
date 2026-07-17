import {
  Beer,
  Citrus,
  Coffee,
  CupSoda,
  Droplet,
  Droplets,
  Dumbbell,
  GlassWater,
  Leaf,
  Martini,
  Milk,
  Soup,
  Wheat,
  Wine,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

import type { DrinkIcon as DrinkIconName } from '../../domain/models';

const drinkIcons: Record<DrinkIconName, LucideIcon> = {
  water: Droplet,
  sparkling: Droplets,
  tea: Leaf,
  coffee: Coffee,
  milk: Milk,
  juice: Citrus,
  soda: CupSoda,
  sports: Dumbbell,
  energy: Zap,
  cocktail: Martini,
  broth: Soup,
  beer: Beer,
  wine: Wine,
  kvass: Wheat,
  custom: GlassWater,
};

interface DrinkIconProps extends Omit<LucideProps, 'ref'> {
  name: DrinkIconName;
  size?: number;
}

export function DrinkIcon({ name, size = 28, ...props }: DrinkIconProps) {
  const Component = drinkIcons[name];
  return (
    <Component aria-hidden="true" size={size} strokeWidth={2} {...props} />
  );
}
