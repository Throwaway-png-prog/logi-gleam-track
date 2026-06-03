// Daily Spin game logic. Once per user per day (EAT/local date).
// Algorithm: 1-97 → small win 5..20, 98-100 → big win 21..60.
import { supabase } from "@/integrations/supabase/client";

export interface SpinRecord {
  id: string;
  user_id: string;
  spin_date: string;
  amount_ksh: number;
  created_at: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodaysSpin(userId: string): Promise<SpinRecord | null> {
  const { data } = await supabase
    .from("daily_spins" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("spin_date", today())
    .maybeSingle();
  return (data as any) ?? null;
}

export async function listRecentSpins(userId: string, limit = 7): Promise<SpinRecord[]> {
  const { data } = await supabase
    .from("daily_spins" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as any) ?? []) as SpinRecord[];
}

export function rollSpinAmount(): number {
  const roll = Math.floor(Math.random() * 100) + 1; // 1..100
  if (roll <= 97) {
    return Math.floor(Math.random() * (20 - 5 + 1)) + 5; // 5..20
  }
  return Math.floor(Math.random() * (60 - 21 + 1)) + 21; // 21..60
}

/** Performs a spin: insert daily_spins (unique per day), credit points, log tx. */
export async function performSpin(userId: string): Promise<{ amount: number; newBalance: number }> {
  const existing = await getTodaysSpin(userId);
  if (existing) throw new Error("Already spun today");

  const amount = rollSpinAmount();
  const { error } = await supabase.from("daily_spins" as any).insert({
    user_id: userId,
    spin_date: today(),
    amount_ksh: amount,
  } as any);
  if (error) {
    if ((error as any).code === "23505") throw new Error("Already spun today");
    throw error;
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("points, lifetime_earned")
    .eq("id", userId)
    .single();
  const cur = Number((prof as any)?.points ?? 0);
  const lifetime = Number((prof as any)?.lifetime_earned ?? 0);
  const newBalance = cur + amount;
  await supabase
    .from("profiles")
    .update({ points: newBalance, lifetime_earned: lifetime + amount } as any)
    .eq("id", userId);
  await supabase.from("points_transactions" as any).insert({
    user_id: userId,
    delta: amount,
    reason: "Daily Spin reward",
  } as any);
  return { amount, newBalance };
}
