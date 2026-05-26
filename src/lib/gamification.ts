import { supabase } from "@/integrations/supabase/client";

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string; // emoji
  tier: "bronze" | "silver" | "gold";
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  reviewsApproved: number;
  reviewsToday: number;
  currentStreak: number;
  longestStreak: number;
  successfulReferrals: number;
  currentTier: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: "first_review", title: "First Review", description: "Complete your first review", icon: "🌱", tier: "bronze",
    check: (s) => s.reviewsApproved >= 1 },
  { key: "review_machine", title: "Review Machine", description: "Complete 50 approved reviews", icon: "⚙️", tier: "silver",
    check: (s) => s.reviewsApproved >= 50 },
  { key: "elite_reviewer", title: "Elite Reviewer", description: "Complete 200 approved reviews", icon: "👑", tier: "gold",
    check: (s) => s.reviewsApproved >= 200 },
  { key: "tier_master", title: "Tier Master", description: "Reach Platinum tier", icon: "💎", tier: "gold",
    check: (s) => s.currentTier === "Platinum" },
  { key: "referral_king", title: "Referral King", description: "Get 10 successful referrals", icon: "👥", tier: "gold",
    check: (s) => s.successfulReferrals >= 10 },
  { key: "speed_demon", title: "Speed Demon", description: "Complete 10 reviews in one day", icon: "⚡", tier: "silver",
    check: (s) => s.reviewsToday >= 10 },
  { key: "week_warrior", title: "Week Warrior", description: "Maintain a 7-day login streak", icon: "🔥", tier: "silver",
    check: (s) => s.longestStreak >= 7 || s.currentStreak >= 7 },
  { key: "month_legend", title: "Month Legend", description: "Maintain a 30-day login streak", icon: "🏆", tier: "gold",
    check: (s) => s.longestStreak >= 30 || s.currentStreak >= 30 },
];

/** Returns achievement keys that are newly unlocked vs existing list. */
export async function evaluateAchievements(userId: string, existing: string[], stats: AchievementStats): Promise<string[]> {
  const have = new Set(existing);
  const newly: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (have.has(a.key)) continue;
    if (a.check(stats)) newly.push(a.key);
  }
  if (newly.length) {
    const updated = [...existing, ...newly];
    await supabase.from("profiles").update({ achievements: updated as any } as any).eq("id", userId);
    // In-app notification per new badge
    for (const key of newly) {
      const ach = ACHIEVEMENTS.find((x) => x.key === key);
      if (!ach) continue;
      await supabase.from("messages" as any).insert({
        title: `${ach.icon} Achievement unlocked: ${ach.title}`,
        body: ach.description,
        audience: "user", audience_value: userId,
      } as any);
    }
  }
  return newly;
}

// -------- Daily challenges --------
export interface ChallengeTemplate {
  key: string;
  title: string;
  target: number;
  reward_ksh: number;
}
export const DAILY_CHALLENGES: ChallengeTemplate[] = [
  { key: "reviews_5", title: "Complete 5 reviews today", target: 5, reward_ksh: 100 },
  { key: "refer_1", title: "Refer a friend today", target: 1, reward_ksh: 200 },
  { key: "streak_keep", title: "Keep your daily streak going", target: 1, reward_ksh: 50 },
];

export async function ensureTodayChallenges(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("daily_challenges" as any)
    .select("challenge_key").eq("user_id", userId).eq("date", today);
  const have = new Set(((data as any[]) ?? []).map((r) => r.challenge_key));
  const missing = DAILY_CHALLENGES.filter((c) => !have.has(c.key));
  if (missing.length === 0) return;
  await supabase.from("daily_challenges" as any).insert(
    missing.map((c) => ({
      user_id: userId, challenge_key: c.key, target: c.target,
      reward_ksh: c.reward_ksh, progress: 0, date: today,
    })) as any,
  );
}

export async function bumpChallenge(userId: string, key: string, by = 1): Promise<void> {
  await ensureTodayChallenges(userId);
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("daily_challenges" as any)
    .select("*").eq("user_id", userId).eq("date", today).eq("challenge_key", key).maybeSingle();
  const row = data as any;
  if (!row || row.completed_at) return;
  const progress = (row.progress ?? 0) + by;
  const done = progress >= row.target;
  await supabase.from("daily_challenges" as any).update({
    progress, completed_at: done ? new Date().toISOString() : null,
  } as any).eq("id", row.id);
  if (done) {
    // Award reward
    const { data: prof } = await supabase.from("profiles").select("points").eq("id", userId).single();
    const pts = ((prof as any)?.points ?? 0) + Number(row.reward_ksh);
    await supabase.from("profiles").update({ points: pts } as any).eq("id", userId);
    await supabase.from("points_transactions" as any).insert({
      user_id: userId, delta: Number(row.reward_ksh),
      reason: `Daily challenge: ${row.challenge_key}`, ref_id: row.id,
    } as any);
    await supabase.from("messages" as any).insert({
      title: "✅ Challenge complete!",
      body: `You earned KSh ${Number(row.reward_ksh).toLocaleString()} for completing today's challenge.`,
      audience: "user", audience_value: userId,
    } as any);
  }
}

export async function getTodayChallenges(userId: string) {
  await ensureTodayChallenges(userId);
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("daily_challenges" as any)
    .select("*").eq("user_id", userId).eq("date", today).order("challenge_key");
  return ((data as any[]) ?? []).map((r) => {
    const tmpl = DAILY_CHALLENGES.find((c) => c.key === r.challenge_key);
    return { ...r, title: tmpl?.title ?? r.challenge_key };
  });
}

// -------- Daily login streak --------
export async function checkInDailyStreak(userId: string): Promise<{ streak: number; bonus: number; firstToday: boolean }> {
  const { data } = await supabase.from("profiles")
    .select("current_streak, longest_streak, last_streak_date, tier")
    .eq("id", userId).single();
  if (!data) return { streak: 0, bonus: 0, firstToday: false };
  const d = data as any;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);
  const last = d.last_streak_date as string | null;
  if (last === todayIso) return { streak: d.current_streak ?? 0, bonus: 0, firstToday: false };
  let next = 1;
  if (last) {
    const diff = Math.round((today.getTime() - new Date(last).getTime()) / 86400000);
    next = diff === 1 ? (d.current_streak ?? 0) + 1 : 1;
  }
  const bonus = Math.min(50, 10 + (next - 1) * 5);
  const platinumExtra = d.tier === "Platinum" ? 200 : 0;
  const total = bonus + platinumExtra;
  const longest = Math.max(next, d.longest_streak ?? 0);
  await supabase.from("profiles").update({
    current_streak: next, longest_streak: longest, last_streak_date: todayIso,
  } as any).eq("id", userId);
  // Pay bonus
  const { data: prof } = await supabase.from("profiles").select("points").eq("id", userId).single();
  const pts = ((prof as any)?.points ?? 0) + total;
  await supabase.from("profiles").update({ points: pts } as any).eq("id", userId);
  await supabase.from("points_transactions" as any).insert({
    user_id: userId, delta: total,
    reason: `Daily login bonus (${next}-day streak${platinumExtra ? " + Platinum" : ""})`,
  } as any);
  // Streak challenge
  await bumpChallenge(userId, "streak_keep", 1).catch(() => {});
  return { streak: next, bonus: total, firstToday: true };
}

// -------- Leaderboards --------
export type LeaderCategory = "earners" | "reviewers" | "referrers";

export async function getWeeklyLeaderboard(category: LeaderCategory, limit = 20) {
  const start = startOfWeek();
  if (category === "reviewers") {
    const { data } = await supabase.from("review_submissions" as any)
      .select("user_id").eq("status", "approved").gte("created_at", start.toISOString());
    return tallyAndProfile(((data as any[]) ?? []).map((r) => r.user_id), limit, "reviews");
  }
  if (category === "referrers") {
    const { data } = await supabase.from("referral_earnings" as any)
      .select("referrer_id, kind").gte("created_at", start.toISOString());
    const ids = ((data as any[]) ?? [])
      .filter((r) => r.kind?.startsWith("referrer"))
      .map((r) => r.referrer_id);
    return tallyAndProfile(ids, limit, "referrals");
  }
  // earners
  const { data } = await supabase.from("points_transactions" as any)
    .select("user_id, delta").gte("created_at", start.toISOString()).gt("delta", 0);
  const totals = new Map<string, number>();
  ((data as any[]) ?? []).forEach((r) => totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + Number(r.delta)));
  const ids = [...totals.keys()];
  if (!ids.length) return [];
  const { data: profs } = await supabase.from("profiles").select("id, display_name, tier, avatar_url").in("id", ids);
  const map = new Map(((profs as any[]) ?? []).map((p) => [p.id, p]));
  return ids.map((id) => ({
    user_id: id, total: totals.get(id) ?? 0, unit: "KSh",
    display_name: map.get(id)?.display_name ?? "User",
    tier: map.get(id)?.tier ?? "Starter", avatar_url: map.get(id)?.avatar_url ?? null,
  })).sort((a, b) => b.total - a.total).slice(0, limit);
}

async function tallyAndProfile(ids: string[], limit: number, unit: string) {
  const totals = new Map<string, number>();
  ids.forEach((id) => totals.set(id, (totals.get(id) ?? 0) + 1));
  const uIds = [...totals.keys()];
  if (!uIds.length) return [];
  const { data: profs } = await supabase.from("profiles").select("id, display_name, tier, avatar_url").in("id", uIds);
  const map = new Map(((profs as any[]) ?? []).map((p) => [p.id, p]));
  return uIds.map((id) => ({
    user_id: id, total: totals.get(id) ?? 0, unit,
    display_name: map.get(id)?.display_name ?? "User",
    tier: map.get(id)?.tier ?? "Starter", avatar_url: map.get(id)?.avatar_url ?? null,
  })).sort((a, b) => b.total - a.total).slice(0, limit);
}

function startOfWeek() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // back to Monday
  d.setDate(d.getDate() - diff);
  return d;
}

/** Admin: pay this week's top 3 in each category. Idempotent per week. */
export async function payWeeklyLeaderboard(): Promise<{ paid: number; week_start: string }> {
  const week = startOfWeek().toISOString().slice(0, 10);
  const { data: existing } = await supabase.from("weekly_leaderboard_payouts" as any)
    .select("id").eq("week_start", week);
  if (((existing as any[]) ?? []).length > 0) return { paid: 0, week_start: week };

  const prizes = [500, 300, 200];
  let paid = 0;
  for (const cat of ["earners", "reviewers", "referrers"] as LeaderCategory[]) {
    const board = await getWeeklyLeaderboard(cat, 3);
    for (let i = 0; i < board.length; i++) {
      const amount = prizes[i]; if (!amount) continue;
      const row = board[i];
      const { data: prof } = await supabase.from("profiles").select("points").eq("id", row.user_id).single();
      const pts = ((prof as any)?.points ?? 0) + amount;
      await supabase.from("profiles").update({ points: pts } as any).eq("id", row.user_id);
      await supabase.from("points_transactions" as any).insert({
        user_id: row.user_id, delta: amount,
        reason: `Weekly leaderboard prize · ${cat} · rank ${i + 1}`,
      } as any);
      await supabase.from("weekly_leaderboard_payouts" as any).insert({
        week_start: week, category: cat, rank: i + 1, user_id: row.user_id, amount_ksh: amount,
      } as any);
      await supabase.from("messages" as any).insert({
        title: "🏆 Leaderboard prize!",
        body: `You ranked #${i + 1} on this week's ${cat} board. KSh ${amount} added to your balance.`,
        audience: "user", audience_value: row.user_id,
      } as any);
      paid++;
    }
  }
  return { paid, week_start: week };
}
