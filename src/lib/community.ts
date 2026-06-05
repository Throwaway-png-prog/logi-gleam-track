// Community & manager utilities (Telegram/WhatsApp groups + personal manager pool).
import { supabase } from "@/integrations/supabase/client";

export interface Manager {
  id: string;
  name: string;
  phone: string;
  whatsapp_url: string | null;
  active: boolean;
  assigned_count: number;
  created_at: string;
}

export interface CommunityLinks {
  telegram_url: string;
  whatsapp_url: string;
}

export async function getCommunityLinks(): Promise<CommunityLinks> {
  const { data } = await supabase
    .from("system_settings")
    .select("telegram_community_url, whatsapp_community_url" as any)
    .eq("id", 1)
    .maybeSingle();
  return {
    telegram_url: (data as any)?.telegram_community_url ?? "https://t.me/logiback",
    whatsapp_url: (data as any)?.whatsapp_community_url ?? "https://chat.whatsapp.com/logiback",
  };
}

export async function setCommunityLinks(links: CommunityLinks): Promise<void> {
  await supabase
    .from("system_settings")
    .upsert({
      id: 1,
      telegram_community_url: links.telegram_url,
      whatsapp_community_url: links.whatsapp_url,
      updated_at: new Date().toISOString(),
    } as any);
}

export async function listManagers(): Promise<Manager[]> {
  const { data } = await supabase
    .from("managers" as any)
    .select("*")
    .order("created_at", { ascending: true });
  return (data as any) ?? [];
}

export async function addManager(args: { name: string; phone: string; whatsapp_url?: string }): Promise<void> {
  const url = args.whatsapp_url ?? `https://wa.me/${args.phone.replace(/\D/g, "")}`;
  await supabase.from("managers" as any).insert({
    name: args.name,
    phone: args.phone,
    whatsapp_url: url,
    active: true,
  } as any);
}

export async function toggleManager(id: string, active: boolean): Promise<void> {
  await supabase.from("managers" as any).update({ active } as any).eq("id", id);
}

export async function deleteManager(id: string): Promise<void> {
  await supabase.from("managers" as any).delete().eq("id", id);
}

/** Round-robin: pick the active manager with the lowest assigned_count. */
export async function pickNextManager(): Promise<Manager | null> {
  const { data } = await supabase
    .from("managers" as any)
    .select("*")
    .eq("active", true)
    .order("assigned_count", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as any) ?? null;
}

/** Assign a manager to the given user (no-op if already assigned). */
export async function assignManagerToUser(userId: string): Promise<Manager | null> {
  const { data: prof } = await supabase
    .from("profiles")
    .select("manager_id" as any)
    .eq("id", userId)
    .maybeSingle();
  if ((prof as any)?.manager_id) {
    const { data: m } = await supabase
      .from("managers" as any)
      .select("*")
      .eq("id", (prof as any).manager_id)
      .maybeSingle();
    return (m as any) ?? null;
  }
  const next = await pickNextManager();
  if (!next) return null;
  await supabase.from("profiles").update({ manager_id: next.id } as any).eq("id", userId);
  await supabase
    .from("managers" as any)
    .update({ assigned_count: (next.assigned_count ?? 0) + 1 } as any)
    .eq("id", next.id);
  return next;
}

export async function getMyManager(userId: string): Promise<Manager | null> {
  const { data: prof } = await supabase
    .from("profiles")
    .select("manager_id" as any)
    .eq("id", userId)
    .maybeSingle();
  const mid = (prof as any)?.manager_id;
  if (!mid) return assignManagerToUser(userId);
  const { data: m } = await supabase
    .from("managers" as any)
    .select("*")
    .eq("id", mid)
    .maybeSingle();
  return (m as any) ?? null;
}
