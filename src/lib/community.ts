// Community & manager utilities (Telegram groups + personal Telegram manager pool).
import { supabase } from "@/integrations/supabase/client";

export interface Manager {
  id: string;
  name: string;
  phone: string;
  whatsapp_url: string | null;
  telegram_url: string | null;
  telegram_handle: string | null;
  active: boolean;
  assigned_count: number;
  created_at: string;
}

export interface CommunityLinks {
  telegram_url: string;
  whatsapp_url: string;
  paybill_number: string;
  paybill_label: string;
}

export async function getCommunityLinks(): Promise<CommunityLinks> {
  const { data } = await supabase
    .from("system_settings")
    .select("telegram_community_url, whatsapp_community_url, paybill_number, paybill_label" as any)
    .eq("id", 1)
    .maybeSingle();
  return {
    telegram_url: (data as any)?.telegram_community_url ?? "https://t.me/logiback",
    whatsapp_url: (data as any)?.whatsapp_community_url ?? "https://chat.whatsapp.com/logiback",
    paybill_number: (data as any)?.paybill_number ?? "4123456",
    paybill_label: (data as any)?.paybill_label ?? "LogiBack International Paybill",
  };
}

export async function setCommunityLinks(links: Partial<CommunityLinks>): Promise<void> {
  await supabase
    .from("system_settings")
    .upsert({
      id: 1,
      telegram_community_url: links.telegram_url,
      whatsapp_community_url: links.whatsapp_url,
      paybill_number: links.paybill_number,
      paybill_label: links.paybill_label,
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

export async function addManager(args: { name: string; phone: string; telegram_handle?: string; whatsapp_url?: string }): Promise<void> {
  const tg = args.telegram_handle?.replace(/^@/, "");
  await supabase.from("managers" as any).insert({
    name: args.name,
    phone: args.phone,
    whatsapp_url: args.whatsapp_url ?? `https://wa.me/${args.phone.replace(/\D/g, "")}`,
    telegram_handle: tg ?? null,
    telegram_url: tg ? `https://t.me/${tg}` : null,
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

export async function assignManagerToUser(userId: string): Promise<Manager | null> {
  const { data: prof } = await supabase
    .from("profiles")
    .select("manager_id" as any)
    .eq("id", userId)
    .maybeSingle();
  if ((prof as any)?.manager_id) {
    const { data: m } = await supabase
      .from("managers" as any).select("*").eq("id", (prof as any).manager_id).maybeSingle();
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
    .from("profiles").select("manager_id" as any).eq("id", userId).maybeSingle();
  const mid = (prof as any)?.manager_id;
  if (!mid) return assignManagerToUser(userId);
  const { data: m } = await supabase
    .from("managers" as any).select("*").eq("id", mid).maybeSingle();
  return (m as any) ?? null;
}

/** Preferred contact URL: Telegram if available, else WhatsApp fallback. */
export function managerContactUrl(m: Manager): string {
  if (m.telegram_url) return m.telegram_url;
  if (m.telegram_handle) return `https://t.me/${m.telegram_handle.replace(/^@/, "")}`;
  return m.whatsapp_url ?? `https://wa.me/${m.phone.replace(/\D/g, "")}`;
}
