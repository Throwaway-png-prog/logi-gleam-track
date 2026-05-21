export type TierName = "Starter" | "Operator" | "Controller" | "Supervisor";

export interface Tier {
  name: TierName;
  dailyLimit: number;
  pointsPerUnit: number;
  dailyBonus?: number;
  unlockAt: number; // total units to unlock
}

export const TIERS: Tier[] = [
  { name: "Starter", dailyLimit: 50, pointsPerUnit: 60, unlockAt: 0 },
  { name: "Operator", dailyLimit: 200, pointsPerUnit: 150, unlockAt: 250 },
  { name: "Controller", dailyLimit: 500, pointsPerUnit: 300, unlockAt: 2000 },
  { name: "Supervisor", dailyLimit: 1000, pointsPerUnit: 600, dailyBonus: 2000, unlockAt: 10000 },
];

export function getTier(totalUnits: number): Tier {
  let t = TIERS[0];
  for (const tier of TIERS) if (totalUnits >= tier.unlockAt) t = tier;
  return t;
}

export function getNextTier(current: TierName): Tier | null {
  const i = TIERS.findIndex((t) => t.name === current);
  return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
}
