import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Copy, Check, Sun, Moon, ShieldCheck, Award, Loader2, Trophy, Wallet, Flame, Camera,
} from "lucide-react";
import {
  getSessionId, loadProfile, updateProfile, myRedemptions, uploadAvatar,
  type Profile, type RedemptionRequest,
} from "@/lib/api";
import { formatKsh, formatPhoneKE, initialsOf, maskPhone, timeAgo } from "@/lib/format";
import { getTier, getNextTier } from "@/lib/tiers";
import { AppShell } from "@/components/AppShell";


export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — LogiBack Earn" }] }),
});

const ACHIEVEMENTS = [
  { id: "first", label: "First Review", needs: 1 },
  { id: "10", label: "10 Reviews", needs: 10 },
  { id: "50", label: "50 Reviews", needs: 50 },
  { id: "100", label: "100 Reviews", needs: 100 },
  { id: "top", label: "Top Reviewer", needs: 250 },
];

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [mpesa, setMpesa] = useState("");
  const [mpesaSaving, setMpesaSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [reds, setReds] = useState<RedemptionRequest[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { navigate({ to: "/app" }); return; }
    Promise.all([loadProfile(sid), myRedemptions(sid)]).then(([u, r]) => {
      if (u) {
        setUser(u);
        setDisplayName(u.display_name || "");
        setMpesa(u.mpesa_number || u.phone || "");
        const t = (u.theme_pref as "dark" | "light") || "dark";
        setTheme(t);
        applyTheme(t);
      }
      setReds(r.slice(0, 3));
      setLoading(false);
    });
  }, [navigate]);

  function applyTheme(t: "dark" | "light") {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("light", t === "light");
  }

  async function saveDisplayName() {
    if (!user) return;
    if (displayName.trim().length < 3) return;
    const lastChanged = user.display_name_changed_at ? new Date(user.display_name_changed_at).getTime() : 0;
    const weekMs = 7 * 86400 * 1000;
    if (lastChanged && Date.now() - lastChanged < weekMs) {
      alert("Display name can only be changed once per week.");
      return;
    }
    const updated = await updateProfile(user.id, {
      display_name: displayName.trim(),
      display_name_changed_at: new Date().toISOString(),
    });
    setUser(updated);
    setEditing(false);
  }

  async function saveMpesa() {
    if (!user) return;
    setMpesaSaving(true);
    // Simulated verification (no real Daraja in demo)
    await new Promise((r) => setTimeout(r, 800));
    const updated = await updateProfile(user.id, { mpesa_number: mpesa, mpesa_verified: true });
    setUser(updated);
    setMpesaSaving(false);
  }

  async function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    if (user) await updateProfile(user.id, { theme_pref: next });
  }

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  const tier = getTier(user.tier);
  const next = getNextTier(tier.name);
  const reviewsDone = user.reviews_approved ?? 0;
  const tierTarget = 50;
  const tierPct = Math.min(100, (reviewsDone / tierTarget) * 100);

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    const url = await uploadAvatar(user.id, f);
    setUser({ ...user, avatar_url: url });
  }

  return (
    <AppShell user={user}>
    <div className="px-5 pt-5 pb-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button onClick={toggleTheme} className="size-11 rounded-xl glass flex items-center justify-center" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="size-5 text-gold" /> : <Moon className="size-5" />}
        </button>
      </div>

      {/* Avatar + identity */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-5 shadow-elegant mb-5 text-center">
        <label className="relative mx-auto size-20 rounded-3xl bg-gradient-primary shadow-glow flex items-center justify-center font-bold text-3xl text-primary-foreground mb-3 cursor-pointer overflow-hidden block">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <span>{initialsOf(user.display_name || user.full_name)}</span>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarPick} className="hidden" />
          <span className="absolute bottom-0 right-0 size-7 rounded-full bg-gold text-gold-foreground flex items-center justify-center shadow-gold">
            <Camera className="size-3.5" />
          </span>
        </label>

        {editing ? (
          <div className="flex gap-2 max-w-xs mx-auto">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value.replace(/\s+/g, "").slice(0, 20))}
              className="flex-1 h-10 px-3 rounded-lg bg-input border border-border text-center" />
            <button onClick={saveDisplayName} className="px-3 h-10 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold">Save</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-lg font-bold hover:text-gradient-gold">
            @{user.display_name || "set-name"}
          </button>
        )}
        <p className="text-sm text-muted-foreground mt-0.5">{user.full_name}</p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold">
          <Trophy className="size-3.5" /> {tier.name}
        </div>
      </motion.div>

      {/* Account fields */}
      <Card title="Account">
        <Row label="Phone" value={
          <span className="flex items-center gap-2">
            <span className="font-mono">{maskPhone(user.phone)}</span>
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success font-semibold">
              <ShieldCheck className="size-3" /> Verified
            </span>
          </span>
        } />
        <Row label="Worker ID" value={
          <button onClick={() => copy(user.worker_id, "wid")} className="flex items-center gap-1.5 font-mono hover:text-gold">
            {user.worker_id} {copied === "wid" ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </button>
        } />
        <Row label="Member since" value={new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })} />
        <Row label="Last login" value={user.last_login_at ? timeAgo(user.last_login_at) : "—"} />
        <Row label="Review streak" value={<span className="flex items-center gap-1 text-orange-400 font-semibold"><Flame className="size-3.5" /> {user.review_streak ?? 0} days</span>} />
      </Card>


      {/* Tier progress */}
      <Card title="Tier progress">
        <p className="text-sm">
          Complete <span className="font-semibold">{Math.max(0, tierTarget - reviewsDone)}</span> more reviews to {next ? `reach ${next.name}` : "max tier"}.
        </p>
        <div className="mt-2 h-2 rounded-full bg-background/60 overflow-hidden">
          <motion.div animate={{ width: `${tierPct}%` }} transition={{ type: "spring" }} className="h-full bg-gradient-primary" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{reviewsDone} / {tierTarget} reviews approved</p>
      </Card>

      {/* Achievements */}
      <Card title="Achievements">
        <div className="grid grid-cols-5 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = reviewsDone >= a.needs;
            return (
              <div key={a.id} className={`rounded-xl p-2.5 text-center ${unlocked ? "bg-gradient-gold shadow-gold" : "bg-muted/40"}`}>
                <Award className={`size-5 mx-auto ${unlocked ? "text-gold-foreground" : "text-muted-foreground"}`} />
                <p className={`text-[9px] mt-1 font-semibold ${unlocked ? "text-gold-foreground" : "text-muted-foreground"}`}>{a.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Statistics */}
      <Card title="Statistics">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Reviews approved" value={reviewsDone.toString()} />
          <Stat label="Reviews rejected" value={(user.reviews_rejected ?? 0).toString()} />
          <Stat label="Available points" value={user.points.toLocaleString()} />
          <Stat label="Cash value" value={formatKsh(user.points)} />
        </div>
      </Card>

      {/* Referral */}
      <Card title="Referral code">
        <p className="text-xs text-muted-foreground">Share with friends. You get <span className="text-gold font-semibold">500 points</span> when they complete their first review.</p>
        <div className="mt-3 flex items-center justify-between glass rounded-xl p-3 border border-gold/30">
          <span className="font-mono text-lg text-gradient-gold">{user.referral_code}</span>
          <button onClick={() => copy(user.referral_code ?? "", "ref")}
            className="px-3 h-9 rounded-lg bg-gradient-gold text-gold-foreground text-xs font-semibold flex items-center gap-1.5">
            {copied === "ref" ? <Check className="size-4" /> : <Copy className="size-4" />} Copy
          </button>
        </div>
      </Card>

      {/* M-Pesa */}
      <Card title="M-Pesa withdrawal number">
        <div className="flex gap-2">
          <input value={mpesa} onChange={(e) => setMpesa(e.target.value)} placeholder="0712 345 678"
            className="flex-1 h-11 px-3 rounded-lg bg-input border border-border" />
          <button onClick={saveMpesa} disabled={mpesaSaving}
            className="px-4 h-11 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {mpesaSaving ? <Loader2 className="size-4 animate-spin" /> : user.mpesa_verified ? "Update" : "Verify"}
          </button>
        </div>
        {user.mpesa_verified && (
          <p className="text-xs text-success mt-2 flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> Verified · {formatPhoneKE(user.mpesa_number || "")}
          </p>
        )}
      </Card>

      {/* Withdrawal history */}
      <Card title="Recent withdrawals" trailing={<Link to="/redeem" className="text-xs text-gold hover:underline">All →</Link>}>
        {reds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
        ) : (
          <ul className="space-y-2">
            {reds.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-gold" />
                  <span>{formatKsh(r.ksh_value)}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs capitalize">{r.status}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
    </AppShell>
  );
}


function Card({ title, trailing, children }: { title: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{title}</h2>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
