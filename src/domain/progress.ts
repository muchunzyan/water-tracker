export function calculateProgressPercent(
  effectiveHydrationMl: number,
  goalMl: number,
) {
  if (goalMl <= 0) return 0;
  return Math.max(Math.floor((effectiveHydrationMl / goalMl) * 100), 0);
}

export function calculateRemainingMl(
  effectiveHydrationMl: number,
  goalMl: number,
) {
  return Math.max(goalMl - effectiveHydrationMl, 0);
}
