// Teams API — create/join/list with 5-member cap and 5% bonus.
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  bonus_pct: number;
  member_count: number;
  total_earnings: number;
  created_at: string;
}
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  contribution_ksh: number;
}

const MAX_MEMBERS = 5;

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export async function getMyTeam(userId: string): Promise<{ team: Team; members: TeamMember[] } | null> {
  const { data: prof } = await supabase.from("profiles").select("team_id" as any).eq("id", userId).maybeSingle();
  const tid = (prof as any)?.team_id;
  if (!tid) return null;
  const { data: team } = await supabase.from("teams" as any).select("*").eq("id", tid).maybeSingle();
  if (!team) return null;
  const { data: members } = await supabase.from("team_members" as any).select("*").eq("team_id", tid);
  return { team: team as any, members: (members as any) ?? [] };
}

export async function createTeam(userId: string, name: string): Promise<Team> {
  const code = genCode();
  const { data: team, error } = await supabase
    .from("teams" as any)
    .insert({ name, code, owner_id: userId, member_count: 1 } as any)
    .select()
    .single();
  if (error) throw error;
  await supabase.from("team_members" as any).insert({ team_id: (team as any).id, user_id: userId } as any);
  await supabase.from("profiles").update({ team_id: (team as any).id } as any).eq("id", userId);
  return team as any;
}

export async function joinTeam(userId: string, code: string): Promise<Team> {
  const { data: team } = await supabase.from("teams" as any).select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (!team) throw new Error("Team not found");
  if ((team as any).member_count >= MAX_MEMBERS) throw new Error("Team is full (max 5 members)");
  const { error } = await supabase.from("team_members" as any).insert({ team_id: (team as any).id, user_id: userId } as any);
  if (error) throw new Error("Already a member of this team");
  await supabase.from("teams" as any).update({ member_count: (team as any).member_count + 1 } as any).eq("id", (team as any).id);
  await supabase.from("profiles").update({ team_id: (team as any).id } as any).eq("id", userId);
  return team as any;
}

export async function leaveTeam(userId: string, teamId: string): Promise<void> {
  await supabase.from("team_members" as any).delete().eq("team_id", teamId).eq("user_id", userId);
  await supabase.from("profiles").update({ team_id: null } as any).eq("id", userId);
  const { data: t } = await supabase.from("teams" as any).select("member_count").eq("id", teamId).maybeSingle();
  const c = Math.max(0, ((t as any)?.member_count ?? 1) - 1);
  await supabase.from("teams" as any).update({ member_count: c } as any).eq("id", teamId);
}

export async function topTeams(limit = 10): Promise<Team[]> {
  const { data } = await supabase
    .from("teams" as any)
    .select("*")
    .order("total_earnings", { ascending: false })
    .limit(limit);
  return (data as any) ?? [];
}
