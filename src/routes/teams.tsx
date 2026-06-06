import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Users, Trophy, LogOut as LeaveIcon, Loader2, Copy, Check } from "lucide-react";
import { getSessionId, loadProfile, type Profile } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { createTeam, joinTeam, getMyTeam, leaveTeam, topTeams, type Team, type TeamMember } from "@/lib/teams";
import { toast } from "sonner";

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
  head: () => ({ meta: [{ title: "Teams — LogiBack" }] }),
});

function TeamsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [mine, setMine] = useState<{ team: Team; members: TeamMember[] } | null>(null);
  const [board, setBoard] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function refresh(id: string) {
    const [u, m, b] = await Promise.all([loadProfile(id), getMyTeam(id), topTeams(10)]);
    if (u) setUser(u);
    setMine(m);
    setBoard(b);
  }

  useEffect(() => {
    const id = getSessionId();
    if (!id) { navigate({ to: "/app" }); return; }
    refresh(id);
  }, [navigate]);

  async function handleCreate() {
    if (!user || !name.trim()) return;
    setBusy(true);
    try { await createTeam(user.id, name.trim()); await refresh(user.id); setName(""); toast.success("Team created"); }
    catch (e: any) { toast.error(e?.message ?? "Could not create"); }
    finally { setBusy(false); }
  }
  async function handleJoin() {
    if (!user || !code.trim()) return;
    setBusy(true);
    try { await joinTeam(user.id, code.trim()); await refresh(user.id); setCode(""); toast.success("Joined team"); }
    catch (e: any) { toast.error(e?.message ?? "Could not join"); }
    finally { setBusy(false); }
  }
  async function handleLeave() {
    if (!user || !mine) return;
    if (!confirm("Leave this team?")) return;
    setBusy(true);
    try { await leaveTeam(user.id, mine.team.id); await refresh(user.id); toast.success("Left team"); }
    finally { setBusy(false); }
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <AppShell user={user}>
      <div className="px-5 pt-6 pb-8 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/app" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Work better together</p>
            <h1 className="text-xl font-bold text-gradient-gold">Teams</h1>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-5 border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent">
          <p className="text-sm">
            Join up to <strong>5 members</strong> in a team and unlock a <strong className="text-gold">+5% earnings bonus</strong> on every approved review.
          </p>
        </div>

        {mine ? (
          <section className="glass rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Your team</p>
                <h2 className="text-lg font-bold">{mine.team.name}</h2>
              </div>
              <button onClick={handleLeave} className="text-xs text-destructive flex items-center gap-1 px-3 h-9 rounded-lg glass">
                <LeaveIcon className="size-3.5" /> Leave
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-background/40 p-3">
              <span className="text-xs text-muted-foreground">Invite code</span>
              <code className="font-mono text-base font-bold text-gradient-gold flex-1">{mine.team.code}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(mine.team.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="size-9 rounded-lg glass flex items-center justify-center"
              >
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="Members" value={`${mine.team.member_count}/5`} />
              <Stat label="Bonus" value={`+${mine.team.bonus_pct}%`} />
              <Stat label="Earned" value={`KSh ${Number(mine.team.total_earnings).toLocaleString()}`} />
            </div>
          </section>
        ) : (
          <section className="space-y-3 mb-6">
            <div className="glass rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Create a team</p>
              <input
                value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
                placeholder="Team name"
                className="w-full h-12 px-4 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={handleCreate} disabled={busy || !name.trim()} className="mt-3 w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground font-semibold disabled:opacity-40">
                Create team
              </button>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Or join with a code</p>
              <input
                value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6}
                placeholder="ABC123"
                className="w-full h-12 px-4 rounded-xl bg-input border border-border font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={handleJoin} disabled={busy || !code.trim()} className="mt-3 w-full h-11 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-40">
                Join team
              </button>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-4 text-gold" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Team leaderboard</h2>
          </div>
          {board.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              <Users className="size-6 mx-auto mb-2 opacity-50" />
              No teams yet — be the first!
            </div>
          ) : (
            <ul className="space-y-2">
              {board.map((t, i) => (
                <li key={t.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <span className={`size-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    i === 0 ? "bg-gradient-gold text-gold-foreground" :
                    i === 1 ? "bg-muted-foreground/30" : i === 2 ? "bg-orange-500/30" : "bg-background/60"
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.member_count} members</p>
                  </div>
                  <p className="text-sm font-bold text-gradient-gold">KSh {Number(t.total_earnings).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/40 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
