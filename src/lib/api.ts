import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  worker_id: string;
  phone: string;
  pin: string;
  tier: string;
  points: number;
  units_today: number;
  last_reset_date: string;
  created_at: string;
}

export interface LogEntry {
  id: string;
  user_id: string;
  batch_number: string;
  points_earned: number;
  created_at: string;
}

export interface UpgradeRequest {
  id: string;
  user_id: string;
  requested_tier: string;
  amount_paid: number;
  transaction_code: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const SESSION_KEY = "logiback.profile_id";

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}
export function setSessionId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(SESSION_KEY, id);
  else localStorage.removeItem(SESSION_KEY);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function genWorkerId() {
  return `LOG${Math.floor(1000 + Math.random() * 9000)}`;
}

export function genBatch() {
  return `LOG${Date.now()}`;
}

export async function findByPhone(phone: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("phone", phone).maybeSingle();
  return (data as Profile) ?? null;
}

export async function registerProfile(phone: string, pin: string): Promise<Profile> {
  // collision-retry on worker_id
  for (let i = 0; i < 5; i++) {
    const worker_id = genWorkerId();
    const { data, error } = await supabase
      .from("profiles")
      .insert({ phone, pin, worker_id, tier: "Starter", points: 0, units_today: 0, last_reset_date: todayStr() })
      .select()
      .single();
    if (!error && data) return data as Profile;
    if (error && !error.message.includes("worker_id")) throw error;
  }
  throw new Error("Could not generate unique worker id");
}

export async function loginProfile(phone: string, pin: string): Promise<Profile | null> {
  const p = await findByPhone(phone);
  if (!p || p.pin !== pin) return null;
  return p;
}

/** Fetches profile and applies daily reset if needed. */
export async function loadProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  let p = data as Profile;
  if (p.last_reset_date !== todayStr()) {
    const { data: updated } = await supabase
      .from("profiles")
      .update({ units_today: 0, last_reset_date: todayStr() })
      .eq("id", id)
      .select()
      .single();
    if (updated) p = updated as Profile;
  }
  return p;
}

export async function logUnit(profile: Profile, pointsPerUnit: number): Promise<Profile> {
  const batch = genBatch();
  await supabase.from("activity_logs").insert({
    user_id: profile.id,
    batch_number: batch,
    points_earned: pointsPerUnit,
  });
  const { data, error } = await supabase
    .from("profiles")
    .update({
      points: profile.points + pointsPerUnit,
      units_today: profile.units_today + 1,
    })
    .eq("id", profile.id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function recentLogs(userId: string, limit = 10): Promise<LogEntry[]> {
  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as LogEntry[]) ?? [];
}

export async function submitUpgrade(
  userId: string,
  requested_tier: string,
  amount_paid: number,
  transaction_code: string,
) {
  const { error } = await supabase.from("upgrade_requests").insert({
    user_id: userId,
    requested_tier,
    amount_paid,
    transaction_code,
    status: "pending",
  });
  if (error) throw error;
}

export async function myPendingUpgrade(userId: string): Promise<UpgradeRequest | null> {
  const { data } = await supabase
    .from("upgrade_requests")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as UpgradeRequest) ?? null;
}

// --- Supervisor ---
export async function listProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  return (data as Profile[]) ?? [];
}

export async function listPendingUpgrades(): Promise<(UpgradeRequest & { profile?: Profile })[]> {
  const { data } = await supabase
    .from("upgrade_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const reqs = (data as UpgradeRequest[]) ?? [];
  if (reqs.length === 0) return [];
  const ids = [...new Set(reqs.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
  const map = new Map((profs as Profile[] | null ?? []).map((p) => [p.id, p]));
  return reqs.map((r) => ({ ...r, profile: map.get(r.user_id) }));
}

export async function approveUpgrade(req: UpgradeRequest) {
  await supabase.from("upgrade_requests").update({ status: "approved" }).eq("id", req.id);
  const { data: prof } = await supabase.from("profiles").select("*").eq("id", req.user_id).single();
  if (prof) {
    const p = prof as Profile;
    await supabase
      .from("profiles")
      .update({ tier: req.requested_tier, points: p.points + Number(req.amount_paid) })
      .eq("id", p.id);
  }
}

export async function rejectUpgrade(req: UpgradeRequest) {
  await supabase.from("upgrade_requests").update({ status: "rejected" }).eq("id", req.id);
}

// --- System settings ---
export async function getSystemSettings(): Promise<{ maintenance: boolean; redemptions_on_hold: boolean }> {
  const { data } = await supabase
    .from("system_settings")
    .select("maintenance, redemptions_on_hold" as any)
    .eq("id", 1)
    .maybeSingle();
  return {
    maintenance: Boolean((data as any)?.maintenance),
    redemptions_on_hold: Boolean((data as any)?.redemptions_on_hold),
  };
}

export async function getMaintenance(): Promise<boolean> {
  const { data } = await supabase.from("system_settings").select("maintenance").eq("id", 1).maybeSingle();
  return Boolean(data?.maintenance);
}

export async function setMaintenance(on: boolean) {
  await supabase
    .from("system_settings")
    .upsert({ id: 1, maintenance: on, updated_at: new Date().toISOString() });
}

export async function setRedemptionsOnHold(on: boolean) {
  await supabase
    .from("system_settings")
    .upsert({ id: 1, redemptions_on_hold: on, updated_at: new Date().toISOString() } as any);
}

// --- Redemptions ---
export interface RedemptionRequest {
  id: string;
  user_id: string;
  points_redeemed: number;
  ksh_value: number;
  status: "pending" | "completed" | "rejected" | "on_hold";
  created_at: string;
  updated_at: string;
}

export async function submitRedemption(user: Profile, points: number): Promise<Profile> {
  if (points < 1000) throw new Error("Minimum redemption is 1,000 points");
  if (points > user.points) throw new Error("Insufficient points");
  const { error: insErr } = await supabase.from("redemption_requests" as any).insert({
    user_id: user.id,
    points_redeemed: points,
    ksh_value: points,
    status: "pending",
  } as any);
  if (insErr) throw insErr;
  const { data, error } = await supabase
    .from("profiles")
    .update({ points: user.points - points })
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function myRedemptions(userId: string): Promise<RedemptionRequest[]> {
  const { data } = await supabase
    .from("redemption_requests" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as unknown as RedemptionRequest[]) ?? [];
}

export async function listPendingRedemptions(): Promise<(RedemptionRequest & { profile?: Profile })[]> {
  const { data } = await supabase
    .from("redemption_requests" as any)
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const reqs = (data as unknown as RedemptionRequest[]) ?? [];
  if (reqs.length === 0) return [];
  const ids = [...new Set(reqs.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
  const map = new Map((profs as Profile[] | null ?? []).map((p) => [p.id, p]));
  return reqs.map((r) => ({ ...r, profile: map.get(r.user_id) }));
}

export async function approveRedemption(req: RedemptionRequest) {
  await supabase
    .from("redemption_requests" as any)
    .update({ status: "completed", updated_at: new Date().toISOString() } as any)
    .eq("id", req.id);
}

export async function rejectRedemption(req: RedemptionRequest) {
  await supabase
    .from("redemption_requests" as any)
    .update({ status: "rejected", updated_at: new Date().toISOString() } as any)
    .eq("id", req.id);
  const { data: prof } = await supabase.from("profiles").select("*").eq("id", req.user_id).single();
  if (prof) {
    const p = prof as Profile;
    await supabase
      .from("profiles")
      .update({ points: p.points + req.points_redeemed })
      .eq("id", p.id);
  }
}

export function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
