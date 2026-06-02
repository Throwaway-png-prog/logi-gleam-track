import { supabase } from "@/integrations/supabase/client";

/**
 * M-Pesa transaction code rules:
 *  - 10 chars, uppercase alphanumeric
 *  - Real codes start with two letters then 8 alphanumerics
 *  - We accept the broader pattern [A-Z0-9]{10}
 */
const MPESA_RE = /^[A-Z0-9]{10}$/;

export function normalizeMpesaCode(code: string): string {
  return (code || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function validateMpesaCodeFormat(code: string): { ok: boolean; reason?: string } {
  const c = normalizeMpesaCode(code);
  if (!c) return { ok: false, reason: "Enter your M-Pesa transaction code." };
  if (c.length !== 10) return { ok: false, reason: "Transaction code must be exactly 10 characters." };
  if (!MPESA_RE.test(c)) return { ok: false, reason: "Only letters and numbers are allowed." };
  return { ok: true };
}

/** Returns true if the code is already recorded (used by anyone). */
export async function isMpesaCodeUsed(code: string): Promise<boolean> {
  const c = normalizeMpesaCode(code);
  const { data } = await supabase.from("mpesa_codes" as any).select("id").eq("code", c).maybeSingle();
  return !!data;
}

/** Atomically reserve a code. Throws if duplicate or invalid. */
export async function reserveMpesaCode(args: {
  code: string;
  user_id: string;
  used_for: string;
  amount_ksh?: number;
}): Promise<string> {
  const v = validateMpesaCodeFormat(args.code);
  if (!v.ok) throw new Error(v.reason);
  const code = normalizeMpesaCode(args.code);
  const { error } = await supabase.from("mpesa_codes" as any).insert({
    code, user_id: args.user_id, used_for: args.used_for, amount_ksh: args.amount_ksh ?? null,
  } as any);
  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      await flagFraud(args.user_id, "duplicate_mpesa_code", { code, used_for: args.used_for }, 60);
      throw new Error("This transaction code has been used before.");
    }
    throw error;
  }
  return code;
}

/** Lightweight device fingerprint based on stable browser signals. Best-effort. */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width) + "x" + String(screen.height),
    String(screen.colorDepth),
    new Date().getTimezoneOffset(),
    (navigator as any).hardwareConcurrency ?? "",
    (navigator as any).deviceMemory ?? "",
  ].join("|");
  // djb2 hash
  let h = 5381;
  for (let i = 0; i < parts.length; i++) h = ((h << 5) + h + parts.charCodeAt(i)) | 0;
  return "fp_" + (h >>> 0).toString(36);
}

/** Append a fraud flag and bump score. Auto-blocks at score > 90. */
export async function flagFraud(
  user_id: string,
  kind: string,
  evidence: Record<string, unknown>,
  score_delta = 20,
): Promise<void> {
  await supabase.from("fraud_flags" as any).insert({
    user_id, kind, evidence, score_delta,
  } as any);
  const { data } = await supabase.from("profiles").select("fraud_score").eq("id", user_id).maybeSingle();
  const next = Math.min(100, ((data as any)?.fraud_score ?? 0) + score_delta);
  const patch: Record<string, unknown> = { fraud_score: next };
  if (next > 90) {
    patch.blocked = true;
    patch.blocked_reason = "Auto-blocked: fraud score exceeded threshold.";
  }
  await supabase.from("profiles").update(patch as any).eq("id", user_id);
}

/** Record a device fingerprint on this user; flags if it already belongs to another user. */
export async function recordDeviceFingerprint(user_id: string): Promise<void> {
  const fp = getDeviceFingerprint();
  // Check if any other user has used this fingerprint
  const { data: others } = await supabase.from("profiles").select("id, device_fingerprints")
    .neq("id", user_id).contains("device_fingerprints" as any, [fp] as any).limit(2);
  if ((others as any[])?.length) {
    await flagFraud(user_id, "shared_device_fingerprint", {
      fingerprint: fp, other_user_ids: (others as any[]).map((o) => o.id),
    }, 30);
  }
  // Append to current user (keep last 5 unique)
  const { data: me } = await supabase.from("profiles").select("device_fingerprints").eq("id", user_id).maybeSingle();
  const list: string[] = (((me as any)?.device_fingerprints as string[]) ?? []).filter(Boolean);
  if (!list.includes(fp)) {
    const next = [fp, ...list].slice(0, 5);
    await supabase.from("profiles").update({ device_fingerprints: next as any } as any).eq("id", user_id);
  }
}

/** Basic input sanitization — strips control chars, trims, caps length. */
export function sanitizeText(input: string, maxLen = 2000): string {
  if (typeof input !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLen);
}

/** Friendly, non-leaky error mapping. */
export function userFacingError(e: unknown, fallback = "We couldn't process your request. Please try again."): string {
  if (e instanceof Error) {
    const msg = e.message || "";
    if (/duplicate|already been used/i.test(msg)) return msg;
    if (/network|fetch|failed to fetch|timeout/i.test(msg)) return "Connection problem. Check your internet and try again.";
    if (/insufficient|not enough/i.test(msg)) return msg;
    if (/invalid|format|required/i.test(msg) && msg.length < 140) return msg;
  }
  return fallback;
}

/** Deterministic per-user shuffle (changes daily). */
export function shuffleForUser<T>(arr: T[], userId: string, salt: string | number = ""): T[] {
  const seedKey = `${userId}|${new Date().toISOString().slice(0, 10)}|${salt}`;
  let seed = 2166136261;
  for (let i = 0; i < seedKey.length; i++) {
    seed ^= seedKey.charCodeAt(i);
    seed = (seed * 16777619) >>> 0;
  }
  function rand() {
    seed = (seed * 48271) % 0x7fffffff;
    return seed / 0x7fffffff;
  }
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fraud queue helpers for admin. */
export async function listFraudFlags(status: "open" | "resolved" | "all" = "open", limit = 200) {
  let q = supabase.from("fraud_flags" as any).select("*").order("created_at", { ascending: false }).limit(limit);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return (data as any[]) ?? [];
}

export async function clearFraudFlag(id: string) {
  await supabase.from("fraud_flags" as any).update({ status: "resolved" } as any).eq("id", id);
}

export async function resetFraudScore(user_id: string) {
  await supabase.from("profiles").update({ fraud_score: 0 } as any).eq("id", user_id);
  await supabase.from("fraud_flags" as any).update({ status: "resolved" } as any).eq("user_id", user_id).eq("status", "open");
}

/** Money flow snapshot for admin dashboard. */
export async function moneyFlowSnapshot(): Promise<{
  totalDepositsKsh: number;
  totalPayoutsKsh: number;
  pendingPayoutsKsh: number;
  platformBalanceKsh: number;
  topUpgraders: { user_id: string; display_name: string; total_paid: number }[];
  runwayDays: number | null;
  dailyFlow: { day: string; deposits: number; payouts: number }[];
}> {
  const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0, 0, 0, 0);
  const [{ data: ups }, { data: reds }, { data: profs }] = await Promise.all([
    supabase.from("tier_upgrades" as any).select("user_id, fee_ksh, paid_at"),
    supabase.from("redemption_requests" as any).select("ksh_value, status, updated_at, created_at"),
    supabase.from("profiles").select("id, display_name"),
  ]);
  const upsList = ((ups as any[]) ?? []);
  const redsList = ((reds as any[]) ?? []);
  const profMap = new Map(((profs as any[]) ?? []).map((p) => [p.id, p.display_name || "User"]));

  const totalDepositsKsh = upsList.reduce((s, u) => s + Number(u.fee_ksh ?? 0), 0);
  const totalPayoutsKsh = redsList.filter((r) => r.status === "completed").reduce((s, r) => s + Number(r.ksh_value ?? 0), 0);
  const pendingPayoutsKsh = redsList.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.ksh_value ?? 0), 0);
  const platformBalanceKsh = totalDepositsKsh - totalPayoutsKsh;

  // Top upgraders
  const totals = new Map<string, number>();
  upsList.forEach((u) => totals.set(u.user_id, (totals.get(u.user_id) ?? 0) + Number(u.fee_ksh ?? 0)));
  const topUpgraders = [...totals.entries()].map(([user_id, total_paid]) => ({
    user_id, display_name: profMap.get(user_id) ?? "User", total_paid,
  })).sort((a, b) => b.total_paid - a.total_paid).slice(0, 10);

  // Daily flow (last 30 days)
  const dailyFlow: { day: string; deposits: number; payouts: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since); d.setDate(since.getDate() + i);
    dailyFlow.push({ day: d.toISOString().slice(0, 10), deposits: 0, payouts: 0 });
  }
  const dayMap = new Map(dailyFlow.map((b) => [b.day, b]));
  upsList.forEach((u) => {
    const k = String(u.paid_at).slice(0, 10);
    const b = dayMap.get(k); if (b) b.deposits += Number(u.fee_ksh ?? 0);
  });
  redsList.filter((r) => r.status === "completed").forEach((r) => {
    const k = String(r.updated_at ?? r.created_at).slice(0, 10);
    const b = dayMap.get(k); if (b) b.payouts += Number(r.ksh_value ?? 0);
  });

  // Runway: at current avg daily payout, how many days until balance is exhausted
  const avgDailyPayout = dailyFlow.reduce((s, b) => s + b.payouts, 0) / 30;
  const runwayDays = avgDailyPayout > 0 && platformBalanceKsh > 0
    ? Math.floor(platformBalanceKsh / avgDailyPayout) : null;

  return { totalDepositsKsh, totalPayoutsKsh, pendingPayoutsKsh, platformBalanceKsh, topUpgraders, runwayDays, dailyFlow };
}
