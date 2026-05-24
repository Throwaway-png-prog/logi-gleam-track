import { supabase } from "@/integrations/supabase/client";

export interface InterviewResponses {
  why: string;
  country: string;
  education: string;
  experience: string;
  expected: string;
}

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
  last_login_at?: string | null;
  review_streak?: number;
  last_review_date?: string | null;
  interview_responses?: InterviewResponses | null;
  referred_by?: string | null;
  total_referral_earnings?: number;
  lifetime_earned?: number;
  terms_accepted_at?: string | null;
}

export interface EmergencyState {
  active: boolean;
  message: string;
  started_at: string | null;
  duration_seconds: number;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  kind: "announcement" | "spotlight" | "top_reviewer" | "review";
  created_by: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  title: string;
  body: string;
  audience: "all" | "tier" | "user";
  audience_value: string | null;
  created_at: string;
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
  opts?: { referred_by?: string | null; terms_accepted?: boolean },
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
        referred_by: opts?.referred_by ?? null,
        terms_accepted_at: opts?.terms_accepted ? new Date().toISOString() : null,
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
// Per-job payout is tier-based, NOT product-based. The product's points_reward
// is a display fallback only. We read the user's current tier rate from TIERS.
import { getTier } from "./tiers";

export async function submitReview(args: {
  user_id: string;
  product: Product;
  review_text: string;
  rating: number;
  screenshot_url: string | null;
}): Promise<ReviewSubmission> {
  // Look up user tier to compute payout
  const { data: prof } = await supabase.from("profiles").select("tier").eq("id", args.user_id).single();
  const tier = getTier((prof as any)?.tier ?? "Starter");
  const payout = tier.pointsPerUnit;

  const { data, error } = await supabase.from("review_submissions" as any).insert({
    user_id: args.user_id,
    product_id: args.product.id,
    review_text: args.review_text,
    rating: args.rating,
    screenshot_url: args.screenshot_url,
    points_reward: payout,
    status: "pending",
  } as any).select().single();
  if (error) throw error;

  // Bump units_today (counts toward tier daily limit)
  const { data: full } = await supabase.from("profiles").select("units_today").eq("id", args.user_id).single();
  if (full) {
    await supabase.from("profiles").update({ units_today: ((full as any).units_today ?? 0) + 1 } as any).eq("id", args.user_id);
  }

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
    const wasFirst = (p.reviews_approved ?? 0) === 0;
    await supabase.from("profiles").update({
      points: p.points + req.points_reward,
      reviews_approved: (p.reviews_approved ?? 0) + 1,
      lifetime_earned: Number(p.lifetime_earned ?? 0) + req.points_reward,
    } as any).eq("id", p.id);
    await supabase.from("points_transactions" as any).insert({
      user_id: p.id, delta: req.points_reward, reason: "Review approved", ref_id: req.id,
    } as any);

    // First-job referral payout
    if (wasFirst && p.referred_by) {
      await creditFirstJobReferral(p.id, p.referred_by);
    }
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

// --- Products with rotation (exclude already reviewed) ---
export async function listAvailableProducts(userId: string): Promise<Product[]> {
  const [allRes, revRes] = await Promise.all([
    supabase.from("products" as any).select("*").eq("active", true).order("created_at", { ascending: true }),
    supabase.from("review_submissions" as any).select("product_id, status").eq("user_id", userId).neq("status", "rejected"),
  ]);
  const all = (allRes.data as unknown as Product[]) ?? [];
  const seen = new Set(((revRes.data as unknown as { product_id: string }[]) ?? []).map((r) => r.product_id));
  return all.filter((p) => !seen.has(p.id));
}

// --- Streak update on review submit ---
export async function bumpStreak(userId: string): Promise<void> {
  const { data } = await supabase.from("profiles").select("review_streak, last_review_date").eq("id", userId).single();
  if (!data) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);
  const last = (data as any).last_review_date as string | null;
  const cur = (data as any).review_streak as number ?? 0;
  let next = cur;
  if (!last) next = 1;
  else if (last === todayIso) next = cur;
  else {
    const lastD = new Date(last);
    const diff = Math.round((today.getTime() - lastD.getTime()) / 86400000);
    next = diff === 1 ? cur + 1 : 1;
  }
  await supabase.from("profiles").update({ review_streak: next, last_review_date: todayIso } as any).eq("id", userId);
}

// --- Last login ---
export async function markLogin(userId: string): Promise<void> {
  await supabase.from("profiles").update({ last_login_at: new Date().toISOString() } as any).eq("id", userId);
}

// --- Messages ---
export async function listMessagesFor(user: Profile): Promise<Message[]> {
  const { data } = await supabase.from("messages" as any).select("*").order("created_at", { ascending: false }).limit(100);
  const all = (data as unknown as Message[]) ?? [];
  return all.filter((m) =>
    m.audience === "all"
    || (m.audience === "tier" && m.audience_value === user.tier)
    || (m.audience === "user" && m.audience_value === user.id)
  );
}
export async function getReadMessageIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("message_reads" as any).select("message_id").eq("user_id", userId);
  return new Set(((data as unknown as { message_id: string }[]) ?? []).map((r) => r.message_id));
}
export async function markMessageRead(userId: string, messageId: string): Promise<void> {
  await supabase.from("message_reads" as any).upsert({ user_id: userId, message_id: messageId } as any, { onConflict: "user_id,message_id" });
}
export async function sendMessage(args: { title: string; body: string; audience: "all" | "tier" | "user"; audience_value?: string | null }) {
  await supabase.from("messages" as any).insert({
    title: args.title, body: args.body, audience: args.audience, audience_value: args.audience_value ?? null,
  } as any);
}

// --- Avatar upload ---
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type || "image/png", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.from("profiles").update({ avatar_url: data.publicUrl } as any).eq("id", userId);
  return data.publicUrl;
}

// --- Admin ---
export async function adminListAllReviews(limit = 200): Promise<(ReviewSubmission & { product?: Product; profile?: Profile })[]> {
  const { data } = await supabase.from("review_submissions" as any).select("*").order("created_at", { ascending: false }).limit(limit);
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
export async function adminListAllRedemptions(limit = 200): Promise<(RedemptionRequest & { profile?: Profile })[]> {
  const { data } = await supabase.from("redemption_requests" as any).select("*").order("created_at", { ascending: false }).limit(limit);
  const rows = (data as unknown as RedemptionRequest[]) ?? [];
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
  const map = new Map(((profs as Profile[]) ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, profile: map.get(r.user_id) }));
}
export async function adminFinancialStats(): Promise<{ pointsInCirculation: number; pointsPaidOut: number; pendingPayouts: number; totalUsers: number; totalProducts: number }> {
  const [usersRes, redRes, prodRes] = await Promise.all([
    supabase.from("profiles").select("points"),
    supabase.from("redemption_requests" as any).select("ksh_value, status"),
    supabase.from("products" as any).select("id", { count: "exact", head: true }),
  ]);
  const users = (usersRes.data as unknown as { points: number }[]) ?? [];
  const reds = (redRes.data as unknown as { ksh_value: number; status: string }[]) ?? [];
  return {
    pointsInCirculation: users.reduce((s, u) => s + (u.points ?? 0), 0),
    pointsPaidOut: reds.filter((r) => r.status === "completed").reduce((s, r) => s + Number(r.ksh_value), 0),
    pendingPayouts: reds.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.ksh_value), 0),
    totalUsers: users.length,
    totalProducts: prodRes.count ?? 0,
  };
}
export async function adminUpsertProduct(p: Partial<Product> & { id?: string }): Promise<void> {
  if (p.id) {
    await supabase.from("products" as any).update(p as any).eq("id", p.id);
  } else {
    await supabase.from("products" as any).insert({
      name: p.name, brand: p.brand, category: p.category, price_ksh: p.price_ksh,
      platform: p.platform, image_url: p.image_url, points_reward: p.points_reward,
      est_minutes: p.est_minutes ?? "2-3 minutes", active: p.active ?? true,
    } as any);
  }
}
export async function setRegistrationOpen(open: boolean) {
  await supabase.from("system_settings").upsert({ id: 1, registration_open: open, updated_at: new Date().toISOString() } as any);
}
export async function getRegistrationOpen(): Promise<boolean> {
  const { data } = await supabase.from("system_settings").select("registration_open" as any).eq("id", 1).maybeSingle();
  return (data as any)?.registration_open !== false;
}

export function greetingFor(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
