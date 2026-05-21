import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck, Loader2, Users, Inbox, Power, Check, X, ArrowLeft, AlertCircle, Wallet, PauseCircle,
} from "lucide-react";
import {
  listProfiles, listPendingUpgrades, approveUpgrade, rejectUpgrade,
  listPendingRedemptions, approveRedemption, rejectRedemption,
  getSystemSettings, setMaintenance, setRedemptionsOnHold,
  type Profile, type UpgradeRequest, type RedemptionRequest,
} from "@/lib/api";

const SUPERVISOR_PIN = "123456";

export const Route = createFileRoute("/supervisor")({
  component: SupervisorPage,
  head: () => ({ meta: [{ title: "Supervisor portal — LogiBack" }] }),
});

function SupervisorPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (pin === SUPERVISOR_PIN) { setAuthed(true); setError(null); }
    else setError("Incorrect supervisor PIN");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <Link to="/" className="absolute top-6 left-6 size-11 rounded-xl glass flex items-center justify-center">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="size-16 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold mb-4">
          <ShieldCheck className="size-8 text-gold-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Supervisor portal</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Enter your 6-digit access PIN</p>
        <div className="w-full max-w-sm glass rounded-2xl p-5">
          <input
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            className="w-full h-14 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground tracking-[0.5em] text-lg text-center focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" /> {error}
            </div>
          )}
          <button
            onClick={submit}
            disabled={pin.length !== 6}
            className="mt-4 w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-40 active:scale-[0.98] transition"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return <SupervisorDashboard />;
}

function SupervisorDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pending, setPending] = useState<(UpgradeRequest & { profile?: Profile })[]>([]);
  const [maint, setMaint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const [pp, up, m] = await Promise.all([listProfiles(), listPendingUpgrades(), getMaintenance()]);
    setProfiles(pp); setPending(up); setMaint(m); setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function toggleMaint() {
    const next = !maint;
    setMaint(next);
    await setMaintenance(next);
  }

  async function approve(req: UpgradeRequest) {
    setBusy(req.id);
    await approveUpgrade(req);
    setBusy(null);
    refresh();
  }
  async function reject(req: UpgradeRequest) {
    setBusy(req.id);
    await rejectUpgrade(req);
    setBusy(null);
    refresh();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Portal</p>
            <h1 className="text-xl font-bold text-gradient-gold">Supervisor</h1>
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={toggleMaint}
        className={`w-full glass rounded-2xl p-4 mb-5 flex items-center justify-between border ${
          maint ? "border-destructive/50 bg-destructive/10" : "border-primary/40 bg-primary/5"
        }`}
      >
        <div className="flex items-center gap-3">
          <Power className={`size-5 ${maint ? "text-destructive" : "text-primary"}`} />
          <div className="text-left">
            <p className="font-semibold">{maint ? "Maintenance mode" : "System active"}</p>
            <p className="text-xs text-muted-foreground">
              {maint ? "Workers cannot log units." : "Workers can scan and log normally."}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${maint ? "text-destructive" : "text-primary"}`}>
          {maint ? "OFF" : "ON"}
        </span>
      </motion.button>

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="size-4 text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Pending upgrades ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No pending requests.</div>
        ) : (
          <ul className="space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {r.profile?.worker_id ?? "Unknown"} → <span className="text-gradient-gold">{r.requested_tier}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.profile?.phone}</p>
                    <p className="text-xs mt-2">
                      KSh {Number(r.amount_paid).toLocaleString()} · <span className="font-mono">{r.transaction_code}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => reject(r)}
                      disabled={busy === r.id}
                      className="size-11 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center active:scale-95 disabled:opacity-50"
                      aria-label="Reject"
                    >
                      <X className="size-5" />
                    </button>
                    <button
                      onClick={() => approve(r)}
                      disabled={busy === r.id}
                      className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 disabled:opacity-50"
                      aria-label="Approve"
                    >
                      {busy === r.id ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Workers ({profiles.length})</h2>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="text-left p-3">Worker</th>
                <th className="text-left p-3">Tier</th>
                <th className="text-right p-3">Points</th>
                <th className="text-right p-3">Today</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-border/40 last:border-0">
                  <td className="p-3">
                    <p className="font-mono font-semibold">{p.worker_id}</p>
                    <p className="text-xs text-muted-foreground">{p.phone}</p>
                  </td>
                  <td className="p-3">{p.tier}</td>
                  <td className="p-3 text-right text-gold font-semibold">{p.points.toLocaleString()}</td>
                  <td className="p-3 text-right">{p.units_today}</td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No workers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
