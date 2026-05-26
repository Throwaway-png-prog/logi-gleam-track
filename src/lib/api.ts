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
  // New fields (tier progression + gamification)
  jobs_in_tier?: number;
  current_streak?: number;
  longest_streak?: number;
  last_streak_date?: string | null;
  achievements?: string[];
  blocked?: boolean;
  blocked_reason?: string | null;
  warnings?: number;
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
  payment_number_id?: string | null;
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
    if (!error && data) {
      const p = data as Profile;
      // Credit referrer immediately on signup
      if (p.referred_by) {
        creditReferrerOnSignup(p.id, p.referred_by).catch(() => {});
      }
      return p;
    }
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

// --- Onboarding interview ---
export async function saveInterview(userId: string, responses: InterviewResponses): Promise<void> {
  await supabase.from("profiles").update({ interview_responses: responses as any } as any).eq("id", userId);
}

// --- Terms ---
export async function acceptTerms(userId: string): Promise<void> {
  await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() } as any).eq("id", userId);
}

// --- Referrals ---
const REFERRAL_LS_KEY = "logiback.pending_ref";
export function getPendingReferral(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFERRAL_LS_KEY);
}
export function setPendingReferral(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) localStorage.setItem(REFERRAL_LS_KEY, code);
  else localStorage.removeItem(REFERRAL_LS_KEY);
}
export async function findProfileByReferralCode(code: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("referral_code", code).maybeSingle();
  return (data as Profile) ?? null;
}

const REFERRER_BONUS = 100;
const REFERRED_BONUS = 50;

async function creditFirstJobReferral(referredId: string, referrerId: string): Promise<void> {
  // Pay referrer
  const { data: referrer } = await supabase.from("profiles").select("*").eq("id", referrerId).single();
  if (referrer) {
    const r = referrer as Profile;
    await supabase.from("profiles").update({
      points: r.points + REFERRER_BONUS,
      total_referral_earnings: Number(r.total_referral_earnings ?? 0) + REFERRER_BONUS,
    } as any).eq("id", r.id);
    await supabase.from("points_transactions" as any).insert({
      user_id: r.id, delta: REFERRER_BONUS, reason: "Referral bonus — friend's first job", ref_id: referredId,
    } as any);
    await supabase.from("referral_earnings" as any).insert({
      referrer_id: referrerId, referred_id: referredId, amount_ksh: REFERRER_BONUS, kind: "referrer_first_job",
    } as any);
  }
  // Pay referred user welcome bonus
  const { data: referred } = await supabase.from("profiles").select("*").eq("id", referredId).single();
  if (referred) {
    const r = referred as Profile;
    await supabase.from("profiles").update({ points: r.points + REFERRED_BONUS } as any).eq("id", r.id);
    await supabase.from("points_transactions" as any).insert({
      user_id: r.id, delta: REFERRED_BONUS, reason: "Welcome bonus (referred sign-up)", ref_id: referrerId,
    } as any);
    await supabase.from("referral_earnings" as any).insert({
      referrer_id: referrerId, referred_id: referredId, amount_ksh: REFERRED_BONUS, kind: "referred_welcome",
    } as any);
  }
}

export interface ReferralRow {
  id: string;
  display_name: string;
  joined_at: string;
  earnings: number;
}
export async function myReferrals(userId: string): Promise<ReferralRow[]> {
  const [{ data: profs }, { data: earns }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, created_at").eq("referred_by", userId),
    supabase.from("referral_earnings" as any).select("referred_id, amount_ksh, kind").eq("referrer_id", userId),
  ]);
  const earnMap = new Map<string, number>();
  ((earns as any[]) ?? []).forEach((e) => {
    if (e.kind?.startsWith("referrer")) earnMap.set(e.referred_id, (earnMap.get(e.referred_id) ?? 0) + Number(e.amount_ksh));
  });
  return ((profs as any[]) ?? []).map((p) => ({
    id: p.id, display_name: p.display_name || "User", joined_at: p.created_at,
    earnings: earnMap.get(p.id) ?? 0,
  }));
}

export async function topReferrersThisMonth(limit = 10): Promise<{ user_id: string; display_name: string; total: number }[]> {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const { data: earns } = await supabase.from("referral_earnings" as any)
    .select("referrer_id, amount_ksh, kind")
    .gte("created_at", start.toISOString());
  const totals = new Map<string, number>();
  ((earns as any[]) ?? []).forEach((e) => {
    if (e.kind?.startsWith("referrer")) totals.set(e.referrer_id, (totals.get(e.referrer_id) ?? 0) + Number(e.amount_ksh));
  });
  const ids = [...totals.keys()];
  if (!ids.length) return [];
  const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  const map = new Map(((profs as any[]) ?? []).map((p) => [p.id, p.display_name || "User"]));
  return ids
    .map((id) => ({ user_id: id, display_name: map.get(id) ?? "User", total: totals.get(id)! }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// --- Emergency alerts ---
export async function getEmergency(): Promise<EmergencyState> {
  const { data } = await supabase.from("system_settings").select("emergency_active, emergency_message, emergency_started_at, emergency_duration_seconds" as any).eq("id", 1).maybeSingle();
  const d = (data ?? {}) as any;
  return {
    active: Boolean(d.emergency_active),
    message: d.emergency_message ?? "There has been a coordinated attack on our systems. Your data is safe. Please do not share your PIN with anyone. We are rotating security keys. Stay on this screen until countdown ends.",
    started_at: d.emergency_started_at ?? null,
    duration_seconds: Number(d.emergency_duration_seconds ?? 30),
  };
}
export async function startEmergency(message: string, durationSeconds = 30, adminId = "admin"): Promise<void> {
  const startedAt = new Date().toISOString();
  await supabase.from("system_settings").upsert({
    id: 1,
    emergency_active: true,
    emergency_message: message,
    emergency_started_at: startedAt,
    emergency_duration_seconds: durationSeconds,
    updated_at: startedAt,
  } as any);
  await supabase.from("emergency_alerts" as any).insert({
    admin_id: adminId, message, duration_seconds: durationSeconds,
  } as any);
}
export async function stopEmergency(): Promise<void> {
  await supabase.from("system_settings").upsert({
    id: 1, emergency_active: false, updated_at: new Date().toISOString(),
  } as any);
}
export async function listEmergencyAlerts(limit = 50): Promise<{ id: string; message: string; created_at: string; admin_id: string; duration_seconds: number }[]> {
  const { data } = await supabase.from("emergency_alerts" as any).select("*").order("created_at", { ascending: false }).limit(limit);
  return ((data as any[]) ?? []) as any;
}

// --- News ---
export async function listNews(limit = 50): Promise<NewsItem[]> {
  const [adminRes, reviewsRes] = await Promise.all([
    supabase.from("news_items" as any).select("*").order("created_at", { ascending: false }).limit(limit),
    supabase.from("review_submissions" as any).select("id, review_text, rating, created_at, user_id, product_id").eq("status", "approved").order("created_at", { ascending: false }).limit(10),
  ]);
  const adminItems = ((adminRes.data as any[]) ?? []) as NewsItem[];
  const reviews = ((reviewsRes.data as any[]) ?? []);
  if (reviews.length === 0) return adminItems;
  const userIds = [...new Set(reviews.map((r) => r.user_id))];
  const prodIds = [...new Set(reviews.map((r) => r.product_id))];
  const [{ data: profs }, { data: prods }] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", userIds),
    supabase.from("products" as any).select("id, name, image_url").in("id", prodIds),
  ]);
  const um = new Map(((profs as any[]) ?? []).map((p) => [p.id, p.display_name || "Anonymous"]));
  const pm = new Map(((prods as any[]) ?? []).map((p) => [p.id, p]));
  const reviewItems: NewsItem[] = reviews.map((r) => {
    const prod = pm.get(r.product_id);
    return {
      id: `rev-${r.id}`,
      title: `${um.get(r.user_id) ?? "User"} reviewed ${prod?.name ?? "a product"}`,
      body: r.review_text.slice(0, 180) + (r.review_text.length > 180 ? "…" : "") + `  ⭐ ${r.rating}/5`,
      image_url: prod?.image_url ?? null,
      kind: "review",
      created_by: null,
      created_at: r.created_at,
    };
  });
  return [...adminItems, ...reviewItems].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export async function postNews(args: { title: string; body: string; image_url?: string | null; kind: NewsItem["kind"] }) {
  await supabase.from("news_items" as any).insert({
    title: args.title, body: args.body, image_url: args.image_url ?? null, kind: args.kind, created_by: "admin",
  } as any);
}

export async function deleteNews(id: string) {
  if (id.startsWith("rev-")) return;
  await supabase.from("news_items" as any).delete().eq("id", id);
}

export async function likeNews(newsId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  if (newsId.startsWith("rev-")) return { liked: false, count: 0 };
  const { data: existing } = await supabase.from("news_likes" as any).select("id").eq("news_id", newsId).eq("user_id", userId).maybeSingle();
  if (existing) {
    await supabase.from("news_likes" as any).delete().eq("id", (existing as any).id);
  } else {
    await supabase.from("news_likes" as any).insert({ news_id: newsId, user_id: userId } as any);
  }
  const { count } = await supabase.from("news_likes" as any).select("*", { count: "exact", head: true }).eq("news_id", newsId);
  return { liked: !existing, count: count ?? 0 };
}

export async function newsStats(newsIds: string[], userId: string): Promise<Map<string, { likes: number; liked: boolean; comments: number }>> {
  const dbIds = newsIds.filter((id) => !id.startsWith("rev-"));
  const map = new Map<string, { likes: number; liked: boolean; comments: number }>();
  newsIds.forEach((id) => map.set(id, { likes: 0, liked: false, comments: 0 }));
  if (!dbIds.length) return map;
  const [{ data: likes }, { data: mine }, { data: comments }] = await Promise.all([
    supabase.from("news_likes" as any).select("news_id").in("news_id", dbIds),
    supabase.from("news_likes" as any).select("news_id").in("news_id", dbIds).eq("user_id", userId),
    supabase.from("news_comments" as any).select("news_id").in("news_id", dbIds),
  ]);
  ((likes as any[]) ?? []).forEach((l) => { const cur = map.get(l.news_id)!; cur.likes++; });
  ((mine as any[]) ?? []).forEach((l) => { const cur = map.get(l.news_id)!; cur.liked = true; });
  ((comments as any[]) ?? []).forEach((c) => { const cur = map.get(c.news_id)!; cur.comments++; });
  return map;
}

export async function listNewsComments(newsId: string): Promise<{ id: string; body: string; created_at: string; display_name: string }[]> {
  if (newsId.startsWith("rev-")) return [];
  const { data } = await supabase.from("news_comments" as any).select("*").eq("news_id", newsId).order("created_at", { ascending: true });
  const rows = ((data as any[]) ?? []);
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  const m = new Map(((profs as any[]) ?? []).map((p) => [p.id, p.display_name || "User"]));
  return rows.map((r) => ({ id: r.id, body: r.body, created_at: r.created_at, display_name: m.get(r.user_id) ?? "User" }));
}

export async function postNewsComment(newsId: string, userId: string, body: string): Promise<void> {
  if (newsId.startsWith("rev-")) return;
  await supabase.from("news_comments" as any).insert({ news_id: newsId, user_id: userId, body } as any);
}

// --- Tier upgrade attempt ---
export async function recordTierUpgrade(userId: string, fromTier: string, toTier: string, feeKsh: number, txCode: string): Promise<void> {
  await supabase.from("tier_upgrades" as any).insert({
    user_id: userId, from_tier: fromTier, to_tier: toTier, fee_ksh: feeKsh, transaction_code: txCode,
  } as any);
}

