import { supabase } from "@/integrations/supabase/client";
import type { Profile, NewsItem } from "./api";

// --- Login attempts / lockout ---
export interface AttemptResult { allowed: boolean; lockedUntil?: string; failsRecent: number; }

export async function checkLockout(phone: string): Promise<AttemptResult> {
  const masked = maskPhoneServer(phone);
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("login_attempts" as any).select("*")
    .eq("phone_masked", masked).gte("attempted_at", since)
    .order("attempted_at", { ascending: false });
  const rows = ((data as any[]) ?? []);
  const latest = rows[0];
  if (latest?.lockout_until && new Date(latest.lockout_until) > new Date()) {
    return { allowed: false, lockedUntil: latest.lockout_until, failsRecent: rows.filter(r => !r.success).length };
  }
  const fails = rows.filter((r) => !r.success).length;
  return { allowed: true, failsRecent: fails };
}

export async function logLogin(phone: string, success: boolean) {
  const masked = maskPhoneServer(phone);
  // If 5th failed attempt → lock for 5 min
  let lockout_until: string | null = null;
  if (!success) {
    const recent = await checkLockout(phone);
    if (recent.failsRecent + 1 >= 5) {
      lockout_until = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    }
  }
  await supabase.from("login_attempts" as any).insert({
    phone_masked: masked, success, lockout_until,
  } as any);
}

function maskPhoneServer(p: string): string {
  const d = (p || "").replace(/\D/g, "");
  if (d.length < 7) return d;
  return d.slice(0, 4) + "****" + d.slice(-3);
}

// --- Admin actions log ---
export async function logAdminAction(args: {
  user_id?: string | null; action: string; reason?: string; metadata?: Record<string, unknown>;
}) {
  await supabase.from("admin_actions" as any).insert({
    admin_label: "admin", user_id: args.user_id ?? null,
    action: args.action, reason: args.reason ?? null, metadata: args.metadata ?? null,
  } as any);
}

export async function listAdminActions(limit = 200) {
  const { data } = await supabase.from("admin_actions" as any).select("*").order("created_at", { ascending: false }).limit(limit);
  return (data as any[]) ?? [];
}
export async function listLoginAttempts(limit = 200) {
  const { data } = await supabase.from("login_attempts" as any).select("*").order("attempted_at", { ascending: false }).limit(limit);
  return (data as any[]) ?? [];
}

// --- User moderation ---
export async function adminWarnUser(userId: string, reason: string) {
  const { data } = await supabase.from("profiles").select("warnings").eq("id", userId).single();
  const w = ((data as any)?.warnings ?? 0) + 1;
  await supabase.from("profiles").update({ warnings: w } as any).eq("id", userId);
  await supabase.from("messages" as any).insert({
    title: "⚠️ Warning from LogiBack", body: `You received a warning: ${reason}. Warning count: ${w}/3.`,
    audience: "user", audience_value: userId,
  } as any);
  await logAdminAction({ user_id: userId, action: "warn", reason, metadata: { warnings: w } });
}

export async function adminBlockUser(userId: string, reason: string) {
  await supabase.from("profiles").update({ blocked: true, blocked_reason: reason } as any).eq("id", userId);
  await logAdminAction({ user_id: userId, action: "block", reason });
}
export async function adminUnblockUser(userId: string) {
  await supabase.from("profiles").update({ blocked: false, blocked_reason: null } as any).eq("id", userId);
  await logAdminAction({ user_id: userId, action: "unblock" });
}

export async function adminAdjustBalance(userId: string, delta: number, reason: string) {
  const { data } = await supabase.from("profiles").select("points").eq("id", userId).single();
  const cur = (data as any)?.points ?? 0;
  const next = Math.max(0, cur + delta);
  await supabase.from("profiles").update({ points: next } as any).eq("id", userId);
  await supabase.from("points_transactions" as any).insert({
    user_id: userId, delta, reason: `[ADMIN] ${reason}`,
  } as any);
  await logAdminAction({ user_id: userId, action: "balance_adjust", reason, metadata: { delta, before: cur, after: next } });
}

export async function adminForceTier(userId: string, tier: string) {
  await supabase.from("profiles").update({ tier } as any).eq("id", userId);
  await logAdminAction({ user_id: userId, action: "force_tier", metadata: { tier } });
}

export async function adminSoftDelete(userId: string, reason: string) {
  await supabase.from("profiles").update({ deleted_at: new Date().toISOString(), blocked: true, blocked_reason: `Deleted: ${reason}` } as any).eq("id", userId);
  await logAdminAction({ user_id: userId, action: "soft_delete", reason });
}

// --- Payment numbers (rotating M-Pesa) ---
export interface PaymentNumber { id: string; label: string; msisdn: string; active: boolean; use_count: number; last_used_at: string | null; }

export async function listPaymentNumbers(): Promise<PaymentNumber[]> {
  const { data } = await supabase.from("payment_numbers" as any).select("*").order("created_at", { ascending: true });
  return ((data as any[]) ?? []) as PaymentNumber[];
}
export async function addPaymentNumber(label: string, msisdn: string) {
  await supabase.from("payment_numbers" as any).insert({ label, msisdn, active: true } as any);
}
export async function togglePaymentNumber(id: string, active: boolean) {
  await supabase.from("payment_numbers" as any).update({ active } as any).eq("id", id);
}
export async function deletePaymentNumber(id: string) {
  await supabase.from("payment_numbers" as any).delete().eq("id", id);
}
/** Pick the least-used active payment number (round-robin) and bump its counter. */
export async function pickRotatingPaymentNumber(): Promise<PaymentNumber | null> {
  const { data } = await supabase.from("payment_numbers" as any).select("*").eq("active", true)
    .order("use_count", { ascending: true }).order("last_used_at", { ascending: true, nullsFirst: true }).limit(1);
  const pick = ((data as any[]) ?? [])[0] as PaymentNumber | undefined;
  if (!pick) return null;
  await supabase.from("payment_numbers" as any).update({
    use_count: pick.use_count + 1, last_used_at: new Date().toISOString(),
  } as any).eq("id", pick.id);
  return pick;
}

// --- Analytics ---
export interface AnalyticsBucket { day: string; earnings: number; payouts: number; }
export async function getDailyAnalytics(days = 30): Promise<{
  totalUsers: number; activeToday: number; newThisWeek: number;
  totalRevenue: number; totalPayout: number; platformBalance: number;
  topEarners: { id: string; display_name: string; points: number; tier: string }[];
  buckets: AnalyticsBucket[]; newUsersByDay: { day: string; count: number }[];
  pendingPayoutKsh: number;
}> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const periodStart = new Date(today); periodStart.setDate(today.getDate() - (days - 1));

  const [usersRes, txRes, redRes, upRes, todayTxRes, weekUsersRes, allUsersRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, points, tier", { count: "exact" }),
    supabase.from("points_transactions" as any).select("delta, created_at").gte("created_at", periodStart.toISOString()),
    supabase.from("redemption_requests" as any).select("ksh_value, status, created_at"),
    supabase.from("upgrade_requests").select("amount_paid, status, created_at").eq("status", "approved"),
    supabase.from("points_transactions" as any).select("user_id").gte("created_at", today.toISOString()),
    supabase.from("profiles").select("id").gte("created_at", weekAgo.toISOString()),
    supabase.from("profiles").select("id, display_name, points, tier, created_at").order("created_at", { ascending: false }),
  ]);

  const users = ((usersRes.data as any[]) ?? []);
  const txs = ((txRes.data as any[]) ?? []);
  const reds = ((redRes.data as any[]) ?? []);
  const ups = ((upRes.data as any[]) ?? []);
  const todayTx = ((todayTxRes.data as any[]) ?? []);
  const weekUsers = ((weekUsersRes.data as any[]) ?? []);
  const allUsers = ((allUsersRes.data as any[]) ?? []);

  const totalRevenue = ups.reduce((s, u) => s + Number(u.amount_paid ?? 0), 0);
  const totalPayout = reds.filter(r => r.status === "completed").reduce((s, r) => s + Number(r.ksh_value ?? 0), 0);
  const pendingPayoutKsh = reds.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.ksh_value ?? 0), 0);

  // Build per-day buckets
  const bucketMap = new Map<string, AnalyticsBucket>();
  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart); d.setDate(periodStart.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    bucketMap.set(key, { day: key, earnings: 0, payouts: 0 });
  }
  txs.forEach((t) => {
    const k = String(t.created_at).slice(0, 10);
    const b = bucketMap.get(k); if (!b) return;
    if (t.delta > 0) b.earnings += Number(t.delta);
  });
  reds.filter(r => r.status === "completed").forEach((r) => {
    const k = String(r.created_at).slice(0, 10);
    const b = bucketMap.get(k); if (!b) return;
    b.payouts += Number(r.ksh_value);
  });

  // New users by day (same window)
  const userMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart); d.setDate(periodStart.getDate() + i);
    userMap.set(d.toISOString().slice(0, 10), 0);
  }
  allUsers.forEach((u) => {
    const k = String(u.created_at).slice(0, 10);
    if (userMap.has(k)) userMap.set(k, userMap.get(k)! + 1);
  });

  return {
    totalUsers: users.length,
    activeToday: new Set(todayTx.map(t => t.user_id)).size,
    newThisWeek: weekUsers.length,
    totalRevenue, totalPayout,
    platformBalance: totalRevenue - totalPayout,
    topEarners: users
      .map((u) => ({ id: u.id, display_name: u.display_name || "User", points: u.points ?? 0, tier: u.tier ?? "Starter" }))
      .sort((a, b) => b.points - a.points).slice(0, 10),
    buckets: [...bucketMap.values()],
    newUsersByDay: [...userMap.entries()].map(([day, count]) => ({ day, count })),
    pendingPayoutKsh,
  };
}

// --- User detail drilldown ---
export async function getUserDetail(userId: string) {
  const [{ data: prof }, { data: revs }, { data: reds }, { data: ups }, { data: refs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("review_submissions" as any).select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("redemption_requests" as any).select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("upgrade_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("referral_earnings" as any).select("*").eq("referrer_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  return {
    profile: prof as Profile,
    reviews: ((revs as any[]) ?? []),
    redemptions: ((reds as any[]) ?? []),
    upgrades: ((ups as any[]) ?? []),
    referrals: ((refs as any[]) ?? []),
  };
}

// --- News admin ---
export async function listAllNews(): Promise<NewsItem[]> {
  const { data } = await supabase.from("news_items" as any).select("*").order("created_at", { ascending: false });
  return ((data as any[]) ?? []) as NewsItem[];
}
export async function upsertNews(args: { id?: string; title: string; body: string; image_url?: string | null; kind: string; featured?: boolean }) {
  if (args.id) {
    await supabase.from("news_items" as any).update({
      title: args.title, body: args.body, image_url: args.image_url ?? null, kind: args.kind, featured: args.featured ?? false,
    } as any).eq("id", args.id);
  } else {
    await supabase.from("news_items" as any).insert({
      title: args.title, body: args.body, image_url: args.image_url ?? null, kind: args.kind, featured: args.featured ?? false, created_by: "admin",
    } as any);
  }
}

// --- CSV export ---
export function rowsToCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map(r => keys.map(k => esc(r[k])).join(","))].join("\n");
}
export function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Friendly error mapper ---
const ERROR_MAP: Record<string, string> = {
  PIN_INCORRECT: "That PIN doesn't match. Please try again.",
  PHONE_NOT_FOUND: "We couldn't find an account with that phone number.",
  LOCKED_OUT: "Too many failed attempts. Try again in 5 minutes.",
  NETWORK: "Connection problem. Check your internet and try again.",
};
export function friendly(e: unknown): string {
  if (e instanceof Error) {
    if (ERROR_MAP[e.message]) return ERROR_MAP[e.message];
    if (/network|fetch|failed to fetch/i.test(e.message)) return ERROR_MAP.NETWORK;
    return e.message;
  }
  return "Something went wrong. Please try again.";
}
