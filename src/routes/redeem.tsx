import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet, Loader2, CheckCircle2, AlertCircle, Clock, History } from "lucide-react";
import {
  getSessionId, loadProfile, submitRedemption, myRedemptions, getSystemSettings,
  type Profile, type RedemptionRequest,
} from "@/lib/api";

export const Route = createFileRoute("/redeem")({
  component: RedeemPage,
  head: () => ({ meta: [{ title: "Redeem points — LogiBack" }] }),
});

const PRESETS = [5000, 10000, 25000];

function RedeemPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [history, setHistory] = useState<RedemptionRequest[]>([]);
  const [onHold, setOnHold] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [custom, setCustom] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function refresh(id: string) {
    const [p, h, s] = await Promise.all([
      loadProfile(id),
      myRedemptions(id),
      getSystemSettings(),
    ]);
    if (p) setUser(p);
    setHistory(h);
    setOnHold(s.redemptions_on_hold);
  }

  useEffect(() => {
    const id = getSessionId();
    if (!id) { navigate({ to: "/" }); return; }
    refresh(id);
  }, [navigate]);

  const finalAmount = useMemo(() => {
    if (custom) {
      const n = parseInt(custom.replace(/\D/g, ""), 10);
      return Number.isFinite(n) ? n : 0;
    }
    return amount;
  }, [amount, custom]);

  const valid = user && finalAmount >= 1000 && finalAmount <= user.points && !onHold;

  async function submit() {
    if (!user || !valid) return;
    setLoading(true); setError(null);
    try {
      const updated = await submitRedemption(user, finalAmount);
      setUser(updated);
      setSuccess(true);
      setAmount(0); setCustom("");
      setHistory(await myRedemptions(user.id));
    } catch (e: any) {
      setError(e?.message ?? "Could not submit redemption");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Cash out</p>
          <h1 className="text-xl font-bold text-gradient-gold">Redeem points</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-5 mb-5 relative overflow-hidden shadow-elegant"
      >
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
        <div className="flex items-center gap-3 relative">
          <div className="size-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold">
            <Wallet className="size-6 text-gold-foreground" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Available balance</p>
            <p className="text-3xl font-bold text-gradient-primary">{user.points.toLocaleString()}<span className="text-sm text-muted-foreground ml-2">pts</span></p>
            <p className="text-xs text-muted-foreground">≈ KSh {user.points.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {onHold && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Redemptions are currently on hold</p>
            <p className="text-xs text-muted-foreground">Please check back later.</p>
          </div>
        </div>
      )}

      {success && !onHold && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4"
        >
          <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Redemption request submitted</p>
            <p className="text-xs text-muted-foreground">Processing time: 5–30 minutes.</p>
          </div>
        </motion.div>
      )}

      <div className="glass rounded-2xl p-5 mb-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Select amount</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {PRESETS.map((p) => {
            const active = !custom && amount === p;
            const disabled = p > user.points;
            return (
              <button
                key={p}
                disabled={disabled || onHold}
                onClick={() => { setAmount(p); setCustom(""); setSuccess(false); }}
                className={`h-20 rounded-xl border text-center transition active:scale-[0.98] disabled:opacity-30 ${
                  active
                    ? "border-gold bg-gradient-gold text-gold-foreground shadow-gold"
                    : "border-border bg-input"
                }`}
              >
                <p className="font-bold">{(p / 1000)}K</p>
                <p className="text-[10px] uppercase tracking-wider opacity-80">KSh {p.toLocaleString()}</p>
              </button>
            );
          })}
        </div>

        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Or custom amount (min 1,000)
        </label>
        <div className="relative">
          <input
            type="tel"
            inputMode="numeric"
            value={custom}
            disabled={onHold}
            onChange={(e) => { setCustom(e.target.value.replace(/\D/g, "")); setAmount(0); setSuccess(false); }}
            placeholder="0"
            className="w-full h-14 px-4 pr-16 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-lg font-semibold"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wider text-muted-foreground">pts</span>
        </div>

        {finalAmount > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-background/40 p-3">
            <span className="text-sm text-muted-foreground">You'll receive</span>
            <span className="font-bold text-gradient-gold">KSh {finalAmount.toLocaleString()}</span>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" /> {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!valid || loading}
          className="mt-4 w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-40 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : "Request Redemption"}
        </button>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <History className="size-4 text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Redemption history</h2>
        </div>
        {history.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No redemptions yet.</div>
        ) : (
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {r.points_redeemed.toLocaleString()} pts
                    <span className="text-muted-foreground font-normal"> · KSh {Number(r.ksh_value).toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" /> {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: RedemptionRequest["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-gold/15 text-gold border-gold/40" },
    completed: { label: "Completed", cls: "bg-primary/15 text-primary border-primary/40" },
    rejected: { label: "On Hold", cls: "bg-destructive/15 text-destructive border-destructive/40" },
    on_hold: { label: "On Hold", cls: "bg-destructive/15 text-destructive border-destructive/40" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}
