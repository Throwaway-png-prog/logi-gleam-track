export type TierName = "Starter" | "Basic" | "Bronze" | "Silver" | "Gold" | "Platinum";

export interface Tier {
  name: TierName;
  jobsInTier: number;       // lifetime jobs allowed before upgrade is required (Platinum: unlimited)
  pointsPerUnit: number;    // KSh per approved review
  welcomeBonus: number;     // KSh credited when this tier is unlocked
  dailyBonus?: number;      // KSh extra paid for daily login at this tier
  priceKsh?: number;        // upgrade fee to unlock this tier (Starter is free)
  perks: string[];
  description: string;
  /** @deprecated kept for legacy callers — equals jobsInTier */
  dailyLimit: number;
}

const T = (t: Omit<Tier, "dailyLimit">): Tier => ({ ...t, dailyLimit: t.jobsInTier });

export const TIERS: Tier[] = [
  T({ name: "Starter", jobsInTier: 1, pointsPerUnit: 60, welcomeBonus: 0,
      description: "Try the platform with 1 job. Earn KSh 60.",
      perks: ["1 job to test the platform"] }),
  T({ name: "Basic", jobsInTier: 5, pointsPerUnit: 100, welcomeBonus: 50, priceKsh: 100,
      description: "5 jobs · KSh 100 each · +KSh 50 welcome",
      perks: ["5 jobs unlocked", "+KSh 50 welcome bonus"] }),
  T({ name: "Bronze", jobsInTier: 15, pointsPerUnit: 150, welcomeBonus: 100, priceKsh: 500,
      description: "15 jobs · KSh 150 each · daily streak unlocked",
      perks: ["15 jobs unlocked", "+KSh 100 welcome bonus", "Daily streak rewards"] }),
  T({ name: "Silver", jobsInTier: 30, pointsPerUnit: 200, welcomeBonus: 250, priceKsh: 1500,
      description: "30 jobs · KSh 200 each · priority approvals",
      perks: ["30 jobs unlocked", "+KSh 250 welcome bonus", "Priority review approval"] }),
  T({ name: "Gold", jobsInTier: 60, pointsPerUnit: 300, welcomeBonus: 500, priceKsh: 3000,
      description: "60 jobs · KSh 300 each · +10% on every payout",
      perks: ["60 jobs unlocked", "+KSh 500 welcome bonus", "+10% extra on all earnings"] }),
  T({ name: "Platinum", jobsInTier: 999, pointsPerUnit: 500, welcomeBonus: 1000, dailyBonus: 200, priceKsh: 6000,
      description: "Unlimited jobs · KSh 500 each · daily login bonus",
      perks: ["Unlimited jobs", "+KSh 1,000 welcome bonus", "+20% extra on all earnings", "KSh 200 daily login bonus", "Early access to new products"] }),
];

export function getTier(name: string): Tier {
  return TIERS.find((t) => t.name === name) ?? TIERS[0];
}

export function getNextTier(current: string): Tier | null {
  const i = TIERS.findIndex((t) => t.name === current);
  return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
}

/** Earnings multiplier (Gold +10%, Platinum +20%). */
export function tierMultiplier(name: string): number {
  if (name === "Gold") return 1.10;
  if (name === "Platinum") return 1.20;
  return 1.0;
}

/** Can the user upgrade to the next tier? Based on lifetime jobs at current tier. */
export function canUpgradeTo(
  next: Tier,
  user: { jobs_in_tier?: number; units_today?: number; tier: string },
): { ok: boolean; reason?: string } {
  const current = getTier(user.tier);
  const done = Number(user.jobs_in_tier ?? 0);
  if (done < current.jobsInTier) {
    return {
      ok: false,
      reason: `Complete ${current.jobsInTier - done} more ${current.jobsInTier === 1 ? "job" : "jobs"} at ${current.name} to unlock ${next.name}.`,
    };
  }
  return { ok: true };
}
