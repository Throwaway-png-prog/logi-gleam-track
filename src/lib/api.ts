import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  worker_id: string;
  full_name: string;
  display_name: string;
  role: string;
  phone: string;
  pin: string;
  tier: string;
  points: number;
  units_today: number;
  last_reset_date: string;
  created_at: string;
  avatar_url?: string | null;
  mpesa_number?: string | null;
  mpesa_verified?: boolean;
  referral_code?: string | null;
  theme_pref?: string;
  display_name_changed_at?: string | null;
  reviews_approved?: number;
  reviews_rejected?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_ksh: number;
  platform: string;
  image_url: string;
  points_reward: number;
  est_minutes: string;
  active: boolean;
  created_at: string;
}

export interface ReviewSubmission {
  id: string;
  user_id: string;
  product_id: string;
  review_text: string;
  rating: number;
  screenshot_url: string | null;
  points_reward: number;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointsTx {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  ref_id: string | null;
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

export interface RedemptionRequest {
  id: string;
  user_id: string;
  points_redeemed: number;
  ksh_value: number;
  status: "pending" | "completed" | "rejected" | "on_hold";
  created_at: string;
  updated_at: string;
}

// --- Session ---
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

function todayStr() { return new Date().toISOString().slice(0, 10); }
function genWorkerId() { return `LOG${Math.floor(1000 + Math.random() * 9000)}`; }
function genReferral() { return `LBE-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; }

// --- Auth ---
export async function findByPhone(phone: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("phone", phone).maybeSingle();
  return (data as Profile) ?? null;
}

export async function registerProfile(
  phone: string,
  pin: string,
  full_name: string,
  display_name: string,
): Promise<Profile> {
  for (let i = 0; i < 5; i++) {
    const worker_id = genWorkerId();
    const referral_code = genReferral();
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        phone, pin, worker_id, full_name, role: "worker",
        tier: "Starter", points: 0, units_today: 0, last_reset_date: todayStr(),
        display_name, referral_code,
      } as any)
      .select().single();
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

export async function loadProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  let p = data as Profile;
  if (p.last_reset_date !== todayStr()) {
    const { data: updated } = await supabase
      .from("profiles")
      .update({ units_today: 0, last_reset_date: todayStr() })
      .eq("id", id).select().single();
    if (updated) p = updated as Profile;
  }
  return p;
}

export async function updateProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").update(patch as any).eq("id", id).select().single();
  if (error) throw error;
  return data as Profile;
}

// --- Products ---
export async function listProducts(): Promise<Product[]> {
  const { data } = await supabase.from("products" as any).select("*").eq("active", true).order("created_at", { ascending: true });
  return (data as unknown as Product[]) ?? [];
}
export async function getProduct(id: string): Promise<Product | null> {
  const { data } = await supabase.from("products" as any).select("*").eq("id", id).maybeSingle();
  return (data as unknown as Product) ?? null;
}

// --- Review submissions ---
export async function submitReview(args: {
  user_id: string;
  product: Product;
  review_text: string;
  rating: number;
  screenshot_url: string | null;
}): Promise<ReviewSubmission> {
  const { data, error } = await supabase.from("review_submissions" as any).insert({
    user_id: args.user_id,
    product_id: args.product.id,
    review_text: args.review_text,
    rating: args.rating,
    screenshot_url: args.screenshot_url,
    points_reward: args.product.points_reward,
    status: "pending",
  } as any).select().single();
  if (error) throw error;
  return data as unknown as ReviewSubmission;
}

export async function myReviews(userId: string, limit = 50): Promise<(ReviewSubmission & { product?: Product })[]> {
  const { data } = await supabase
    .from("review_submissions" as any).select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(limit);
  const rows = (data as unknown as ReviewSubmission[]) ?? [];
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.product_id))];
  const { data: prods } = await supabase.from("products" as any).select("*").in("id", ids);
  const map = new Map(((prods as unknown as Product[]) ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, product: map.get(r.product_id) }));
}

export async function todaysReviewCount(userId: string): Promise<number> {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const { count } = await supabase.from("review_submissions" as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).gte("created_at", start.toISOString());
  return count ?? 0;
}

export async function listPendingReviews(): Promise<(ReviewSubmission & { product?: Product; profile?: Profile })[]> {
  const { data } = await supabase.from("review_submissions" as any).select("*").eq("status", "pending").order("created_at", { ascending: true });
  const rows = (data as unknown as ReviewSubmission[]) ?? [];
  if (!rows.length) return [];
  const pIds = [...new Set(rows.map((r) => r.product_id))];
  const uIds = [...new Set(rows.map((r) => r.user_id))];
  const [{ data: prods }, { data: profs }] = await Promise.all([
    supabase.from("products" as any).select("*").in("id", pIds),
    supabase.from("profiles").select("*").in("id", uIds),
  ]);
  const pm = new Map(((prods as unknown as Product[]) ?? []).map((p) => [p.id, p]));
  const um = new Map(((profs as Profile[]) ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, product: pm.get(r.product_id), profile: um.get(r.user_id) }));
}

export async function approveReview(req: ReviewSubmission): Promise<void> {
  await supabase.from("review_submissions" as any).update({ status: "approved", updated_at: new Date().toISOString() } as any).eq("id", req.id);
  const { data: prof } = await supabase.from("profiles").select("*").eq("id", req.user_id).single();
  if (prof) {
    const p = prof as Profile;
    await supabase.from("profiles").update({
      points: p.points + req.points_reward,
      reviews_approved: (p.reviews_approved ?? 0) + 1,
    } as any).eq("id", p.id);
    await supabase.from("points_transactions" as any).insert({
      user_id: p.id, delta: req.points_reward, reason: "Review approved", ref_id: req.id,
    } as any);
  }
}

export async function rejectReview(req: ReviewSubmission, reason: string): Promise<void> {
  await supabase.from("review_submissions" as any).update({
    status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString(),
  } as any).eq("id", req.id);
  const { data: prof } = await supabase.from("profiles").select("*").eq("id", req.user_id).single();
  if (prof) {
    const p = prof as Profile;
    await supabase.from("profiles").update({ reviews_rejected: (p.reviews_rejected ?? 0) + 1 } as any).eq("id", p.id);
  }
}

// --- Points transactions ---
export async function myTransactions(userId: string, limit = 20): Promise<PointsTx[]> {
  const { data } = await supabase.from("points_transactions" as any)
    .select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return (data as unknown as PointsTx[]) ?? [];
}

export async function earningsBetween(userId: string, fromIso: string): Promise<number> {
  const { data } = await supabase.from("points_transactions" as any)
    .select("delta").eq("user_id", userId).gte("created_at", fromIso).gt("delta", 0);
  const rows = (data as { delta: number }[] | null) ?? [];
  return rows.reduce((acc, r) => acc + Number(r.delta), 0);
}

// --- Screenshot upload ---
export async function uploadScreenshot(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("review-screenshots").upload(path, file, {
    contentType: file.type || "image/png", upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("review-screenshots").getPublicUrl(path);
  return data.publicUrl;
}

// --- Upgrades ---
export async function submitUpgrade(userId: string, requested_tier: string, amount_paid: number, transaction_code: string) {
  const { error } = await supabase.from("upgrade_requests").insert({
    user_id: userId, requested_tier, amount_paid, transaction_code, status: "pending",
  });
  if (error) throw error;
}
export async function myPendingUpgrade(userId: string): Promise<UpgradeRequest | null> {
  const { data } = await supabase.from("upgrade_requests").select("*")
    .eq("user_id", userId).eq("status", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as UpgradeRequest) ?? null;
}

// --- Supervisor ---
export async function listProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  return (data as Profile[]) ?? [];
}
export async function listPendingUpgrades(): Promise<(UpgradeRequest & { profile?: Profile })[]> {
  const { data } = await supabase.from("upgrade_requests").select("*").eq("status", "pending").order("created_at", { ascending: false });
  const reqs = (data as UpgradeRequest[]) ?? [];
  if (!reqs.length) return [];
  const ids = [...new Set(reqs.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
  const map = new Map(((profs as Profile[]) ?? []).map((p) => [p.id, p]));
  return reqs.map((r) => ({ ...r, profile: map.get(r.user_id) }));
}
export async function approveUpgrade(req: UpgradeRequest) {
  await supabase.from("upgrade_requests").update({ status: "approved" }).eq("id", req.id);
  const { data: prof } = await supabase.from("profiles").select("*").eq("id", req.user_id).single();
  if (prof) {
    const p = prof as Profile;
    await supabase.from("profiles").update({ tier: req.requested_tier, points: p.points + Number(req.amount_paid) }).eq("id", p.id);
    await supabase.from("points_transactions" as any).insert({
      user_id: p.id, delta: Number(req.amount_paid), reason: `Tier upgrade · ${req.requested_tier}`, ref_id: req.id,
    } as any);
  }
}
export async function rejectUpgrade(req: UpgradeRequest) {
  await supabase.from("upgrade_requests").update({ status: "rejected" }).eq("id", req.id);
}

// --- System settings ---
export async function getSystemSettings(): Promise<{ maintenance: boolean; redemptions_on_hold: boolean }> {
  const { data } = await supabase.from("system_settings").select("maintenance, redemptions_on_hold" as any).eq("id", 1).maybeSingle();
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
  await supabase.from("system_settings").upsert({ id: 1, maintenance: on, updated_at: new Date().toISOString() });
}
export async function setRedemptionsOnHold(on: boolean) {
  await supabase.from("system_settings").upsert({ id: 1, redemptions_on_hold: on, updated_at: new Date().toISOString() } as any);
}

// --- Redemptions ---
export async function submitRedemption(user: Profile, points: number): Promise<Profile> {
  if (points < 1000) throw new Error("Minimum redemption is 1,000 points");
  if (points > user.points) throw new Error("Insufficient points");
  const { data: rd, error: insErr } = await supabase.from("redemption_requests" as any).insert({
    user_id: user.id, points_redeemed: points, ksh_value: points, status: "pending",
  } as any).select().single();
  if (insErr) throw insErr;
  const { data, error } = await supabase.from("profiles").update({ points: user.points - points }).eq("id", user.id).select().single();
  if (error) throw error;
  await supabase.from("points_transactions" as any).insert({
    user_id: user.id, delta: -points, reason: "Redemption requested", ref_id: (rd as any)?.id ?? null,
  } as any);
  return data as Profile;
}
export async function myRedemptions(userId: string): Promise<RedemptionRequest[]> {
  const { data } = await supabase.from("redemption_requests" as any).select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data as unknown as RedemptionRequest[]) ?? [];
}
export async function listPendingRedemptions(): Promise<(RedemptionRequest & { profile?: Profile })[]> {
  const { data } = await supabase.from("redemption_requests" as any).select("*").eq("status", "pending").order("created_at", { ascending: false });
  const reqs = (data as unknown as RedemptionRequest[]) ?? [];
  if (!reqs.length) return [];
  const ids = [...new Set(reqs.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
  const map = new Map(((profs as Profile[]) ?? []).map((p) => [p.id, p]));
  return reqs.map((r) => ({ ...r, profile: map.get(r.user_id) }));
}
export async function approveRedemption(req: RedemptionRequest) {
  await supabase.from("redemption_requests" as any).update({ status: "completed", updated_at: new Date().toISOString() } as any).eq("id", req.id);
}
export async function rejectRedemption(req: RedemptionRequest) {
  await supabase.from("redemption_requests" as any).update({ status: "rejected", updated_at: new Date().toISOString() } as any).eq("id", req.id);
  const { data: prof } = await supabase.from("profiles").select("*").eq("id", req.user_id).single();
  if (prof) {
    const p = prof as Profile;
    await supabase.from("profiles").update({ points: p.points + req.points_redeemed }).eq("id", p.id);
    await supabase.from("points_transactions" as any).insert({
      user_id: p.id, delta: req.points_redeemed, reason: "Redemption refunded", ref_id: req.id,
    } as any);
  }
}

export function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
