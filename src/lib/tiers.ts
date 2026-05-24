export type TierName = "Starter" | "Basic" | "Pro" | "Expert";

export interface Tier {
  name: TierName;
  dailyLimit: number;       // jobs allowed per day
  pointsPerUnit: number;    // KSh per job (1 point = KSh 1 throughout the app)
  dailyBonus?: number;      // KSh extra paid daily at this tier
  priceKsh?: number;        // upgrade fee to unlock this tier (Starter is free)
  minEarnedToUnlock?: number; // lifetime KSh earned required to unlock this tier
  description: string;
}

export const TIERS: Tier[] = [
  { name: "Starter", dailyLimit: 1, pointsPerUnit: 60, description: "Try the platform with 1 job. Earn KSh 60." },
  { name: "Basic", dailyLimit: 10, pointsPerUnit: 100, priceKsh: 1000, minEarnedToUnlock: 60, description: "10 jobs/day. Earn KSh 100 per job." },
  { name: "Pro", dailyLimit: 30, pointsPerUnit: 180, priceKsh: 3000, minEarnedToUnlock: 1000, description: "30 jobs/day. Earn KSh 180 per job." },
  { name: "Expert", dailyLimit: 999, pointsPerUnit: 300, dailyBonus: 1000, priceKsh: 10000, minEarnedToUnlock: 5000, description: "Unlimited jobs. Earn KSh 300 per job + KSh 1,000 daily bonus." },
];

export function getTier(name: string): Tier {
  return TIERS.find((t) => t.name === name) ?? TIERS[0];
}

export function getNextTier(current: string): Tier | null {
  const i = TIERS.findIndex((t) => t.name === current);
  return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
}

/** Check if user has met the eligibility gates to upgrade to next tier. */
export function canUpgradeTo(
  next: Tier,
  user: { units_today: number; lifetime_earned?: number; tier: string },
): { ok: boolean; reason?: string } {
  const current = getTier(user.tier);
  if (user.units_today < current.dailyLimit) {
    return { ok: false, reason: `Complete all ${current.dailyLimit} ${current.name} job${current.dailyLimit === 1 ? "" : "s"} today first.` };
  }
  const earned = Number(user.lifetime_earned ?? 0);
  if (next.minEarnedToUnlock && earned < next.minEarnedToUnlock) {
    return { ok: false, reason: `Earn KSh ${next.minEarnedToUnlock.toLocaleString()} total to unlock ${next.name}. You have KSh ${earned.toLocaleString()}.` };
  }
  return { ok: true };
}
