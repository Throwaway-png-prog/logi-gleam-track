// VIP gated-job system. Parallel to the existing tier ladder.
// Uses permissive client-side access (matches the rest of this demo app).
import { supabase } from "@/integrations/supabase/client";
import { pickRotatingPaymentNumber } from "@/lib/admin";

export interface VipJob {
  id: string;
  vip_level: number;
  name: string;
  description: string | null;
  reward_ksh: number;
  is_one_time: boolean;
  task_kind: "rating" | "text" | "multistep" | "form" | "workflow" | "review_queue";
  upgrade_fee_ksh: number | null;
  welcome_bonus_ksh: number | null;
}

export interface VipCompletion {
  id: string;
  user_id: string;
  vip_level: number;
  reward_ksh: number;
  date: string;
  completed_at: string;
}

export interface VipUpgradeRequest {
  id: string;
  user_id: string;
  from_vip: number;
  to_vip: number;
  amount_ksh: number;
  payment_number_id: string | null;
  transaction_code: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export const VIP_NAMES = ["VIP 0", "VIP 1", "VIP 2", "VIP 3", "VIP 4", "VIP 5"];

export async function listVipJobs(): Promise<VipJob[]> {
  const { data } = await supabase.from("vip_jobs" as any).select("*").order("vip_level");
  return (data as any) ?? [];
}

export async function myTodayCompletions(userId: string): Promise<VipCompletion[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("vip_completions" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("date", today);
  return (data as any) ?? [];
}

/** Has this user ever completed VIP 0 (one-time)? */
export async function hasClaimedVip0(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("vip_completions" as any)
    .select("id")
    .eq("user_id", userId)
    .eq("vip_level", 0)
    .limit(1);
  return ((data as any[]) ?? []).length > 0;
}

/** Claim a VIP job: credit the user's points balance and log a completion + transaction. */
export async function claimVipJob(args: {
  userId: string;
  job: VipJob;
  payload?: unknown;
}): Promise<{ newBalance: number }> {
  const { userId, job, payload } = args;

  // Idempotency guards.
  if (job.is_one_time) {
    if (await hasClaimedVip0(userId)) throw new Error("Already claimed");
  } else {
    const today = await myTodayCompletions(userId);
    if (today.some((c) => c.vip_level === job.vip_level)) {
      throw new Error("Already claimed today — come back tomorrow.");
    }
  }

  // Load profile for balance update.
  const { data: prof } = await supabase
    .from("profiles")
    .select("id, points, lifetime_earned, vip_level, vip0_claimed")
    .eq("id", userId)
    .maybeSingle();
  if (!prof) throw new Error("Profile not found");
  if ((prof as any).vip_level < job.vip_level) throw new Error("Locked — upgrade your VIP level first.");

  const newBalance = Number((prof as any).points) + Number(job.reward_ksh);
  const newLifetime = Number((prof as any).lifetime_earned ?? 0) + Number(job.reward_ksh);

  const patch: Record<string, unknown> = {
    points: newBalance,
    lifetime_earned: newLifetime,
  };
  if (job.is_one_time && job.vip_level === 0) patch.vip0_claimed = true;

  await supabase.from("profiles").update(patch as any).eq("id", userId);

  await supabase.from("vip_completions" as any).insert({
    user_id: userId,
    vip_level: job.vip_level,
    reward_ksh: job.reward_ksh,
    task_payload: payload ?? null,
  } as any);

  await supabase.from("points_transactions").insert({
    user_id: userId,
    delta: Number(job.reward_ksh),
    reason: `${job.name} (VIP ${job.vip_level})`,
  });

  return { newBalance };
}

/** Submit a VIP upgrade request. Returns the rotating M-Pesa number it was assigned. */
export async function submitVipUpgrade(args: {
  userId: string;
  fromVip: number;
  toVip: number;
  amountKsh: number;
  txCode: string;
  paymentNumberId: string | null;
}): Promise<VipUpgradeRequest> {
  const { data, error } = await supabase
    .from("vip_upgrade_requests" as any)
    .insert({
      user_id: args.userId,
      from_vip: args.fromVip,
      to_vip: args.toVip,
      amount_ksh: args.amountKsh,
      payment_number_id: args.paymentNumberId,
      transaction_code: args.txCode,
      status: "pending",
    } as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function myPendingVipUpgrade(userId: string): Promise<VipUpgradeRequest | null> {
  const { data } = await supabase
    .from("vip_upgrade_requests" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function listPendingVipUpgrades(): Promise<
  (VipUpgradeRequest & { profile?: { display_name: string; full_name: string; phone: string; worker_id: string } })[]
> {
  const { data } = await supabase
    .from("vip_upgrade_requests" as any)
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const rows = (data as any[]) ?? [];
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, phone, worker_id")
    .in("id", ids);
  const byId = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) })) as any;
}

export async function approveVipUpgrade(req: VipUpgradeRequest): Promise<void> {
  const { data: job } = await supabase
    .from("vip_jobs" as any)
    .select("welcome_bonus_ksh, name")
    .eq("vip_level", req.to_vip)
    .maybeSingle();
  const bonus = Number((job as any)?.welcome_bonus_ksh ?? 0);

  const { data: prof } = await supabase
    .from("profiles")
    .select("points, lifetime_earned")
    .eq("id", req.user_id)
    .maybeSingle();
  const newBalance = Number((prof as any)?.points ?? 0) + bonus;

  await supabase
    .from("profiles")
    .update({
      vip_level: req.to_vip,
      points: newBalance,
      lifetime_earned: Number((prof as any)?.lifetime_earned ?? 0) + bonus,
    })
    .eq("id", req.user_id);

  if (bonus > 0) {
    await supabase.from("points_transactions").insert({
      user_id: req.user_id,
      delta: bonus,
      reason: `VIP ${req.to_vip} welcome bonus`,
    });
  }

  await supabase
    .from("vip_upgrade_requests" as any)
    .update({ status: "approved" } as any)
    .eq("id", req.id);
}

export async function rejectVipUpgrade(req: VipUpgradeRequest): Promise<void> {
  await supabase
    .from("vip_upgrade_requests" as any)
    .update({ status: "rejected" } as any)
    .eq("id", req.id);
}

export async function getRotatingPaymentForUpgrade() {
  return pickRotatingPaymentNumber();
}

/** Increment login-day counter. Call once per app open (per day). */
export async function recordAppOpen(userId: string): Promise<{
  consecutive_login_days: number;
  is_new_day: boolean;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: prof } = await supabase
    .from("profiles")
    .select("last_app_open, consecutive_login_days")
    .eq("id", userId)
    .maybeSingle();
  if (!prof) return { consecutive_login_days: 0, is_new_day: false };
  const last = (prof as any).last_app_open as string | null;
  const days = Number((prof as any).consecutive_login_days ?? 0);

  if (last === today) return { consecutive_login_days: days, is_new_day: false };

  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const next = last === yesterday ? days + 1 : 1;
  await supabase
    .from("profiles")
    .update({ last_app_open: today, consecutive_login_days: next })
    .eq("id", userId);
  return { consecutive_login_days: next, is_new_day: true };
}

/** Decide which nudge (if any) to show this session. */
export type Nudge =
  | { kind: "exhaustion"; nextLevel: number; nextRewardKsh: number; nextFeeKsh: number }
  | { kind: "comparison"; nextLevel: number; weeklyEarnedKsh: number; nextWeeklyKsh: number; uplift: number; nextFeeKsh: number }
  | { kind: "limited"; nextLevel: number; bonusKsh: number; nextFeeKsh: number }
  | { kind: "referral"; bonusKsh: number };

export async function checkUpgradeNudge(args: {
  userId: string;
  vipLevel: number;
  consecutiveLoginDays: number;
  jobs: VipJob[];
  todayCompletions: VipCompletion[];
  vip0Claimed: boolean;
}): Promise<Nudge | null> {
  const { userId, vipLevel, consecutiveLoginDays, jobs, todayCompletions, vip0Claimed } = args;
  const nextLevel = vipLevel + 1;
  const nextJob = jobs.find((j) => j.vip_level === nextLevel);

  // Throttle: at most one nudge per 6h.
  const { data: prof } = await supabase
    .from("profiles")
    .select("last_nudge_at")
    .eq("id", userId)
    .maybeSingle();
  const lastNudgeAt = (prof as any)?.last_nudge_at as string | null;
  if (lastNudgeAt && Date.now() - new Date(lastNudgeAt).getTime() < 6 * 3600_000) return null;

  // Trigger 1: exhaustion — every available job for current tier is done.
  const availableForTier = jobs.filter((j) => j.vip_level <= vipLevel);
  const allDone = availableForTier.every((j) => {
    if (j.is_one_time && j.vip_level === 0) return vip0Claimed;
    return todayCompletions.some((c) => c.vip_level === j.vip_level);
  });
  if (allDone && nextJob && nextJob.upgrade_fee_ksh) {
    await markNudge(userId);
    return {
      kind: "exhaustion",
      nextLevel,
      nextRewardKsh: Number(nextJob.reward_ksh),
      nextFeeKsh: Number(nextJob.upgrade_fee_ksh),
    };
  }

  // Trigger 3: limited offer on day 7/14/21/28.
  if ([7, 14, 21, 28].includes(consecutiveLoginDays) && nextJob && nextJob.upgrade_fee_ksh) {
    await markNudge(userId);
    return {
      kind: "limited",
      nextLevel,
      bonusKsh: Number(nextJob.welcome_bonus_ksh ?? 0) * 2,
      nextFeeKsh: Number(nextJob.upgrade_fee_ksh),
    };
  }

  // Trigger 2: comparison after 5 consecutive days.
  if (consecutiveLoginDays >= 5 && nextJob && nextJob.upgrade_fee_ksh) {
    const currentJob = jobs.find((j) => j.vip_level === vipLevel);
    const dailyNow = Number(currentJob?.reward_ksh ?? 0);
    const dailyNext = Number(nextJob.reward_ksh);
    const uplift = dailyNow > 0 ? Math.round(((dailyNext - dailyNow) / dailyNow) * 100) : 999;
    await markNudge(userId);
    return {
      kind: "comparison",
      nextLevel,
      weeklyEarnedKsh: dailyNow * 7,
      nextWeeklyKsh: dailyNext * 7,
      uplift,
      nextFeeKsh: Number(nextJob.upgrade_fee_ksh),
    };
  }

  return null;
}

async function markNudge(userId: string) {
  await supabase.from("profiles").update({ last_nudge_at: new Date().toISOString() }).eq("id", userId);
}
