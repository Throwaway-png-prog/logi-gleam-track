export type TierName = "Starter" | "Operator" | "Controller" | "Supervisor";

export interface Tier {
  name: TierName;
  dailyLimit: number;
  pointsPerUnit: number;
  dailyBonus?: number;
  priceKsh?: number; // upgrade cost (Starter is free)
}

export const TIERS: Tier[] = [
  { name: "Starter", dailyLimit: 50, pointsPerUnit: 60 },
  { name: "Operator", dailyLimit: 200, pointsPerUnit: 150, priceKsh: 5000 },
  { name: "Controller", dailyLimit: 500, pointsPerUnit: 300, priceKsh: 15000 },
  { name: "Supervisor", dailyLimit: 1000, pointsPerUnit: 600, dailyBonus: 2000, priceKsh: 50000 },
];

export function getTier(name: string): Tier {
  return TIERS.find((t) => t.name === name) ?? TIERS[0];
}

export function getNextTier(current: string): Tier | null {
  const i = TIERS.findIndex((t) => t.name === current);
  return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
}
