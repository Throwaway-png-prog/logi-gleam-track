import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import {
  getSessionId, loadProfile, submitUpgrade, myPendingUpgrade,
  type Profile, type UpgradeRequest,
} from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { TIERS, getTier } from "@/lib/tiers";

export const Route = createFileRoute("/upgrade")({
  component: UpgradePage,
  head: () => ({ meta: [{ title: "Upgrade tier — LogiBack" }] }),
});

function UpgradePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [pending, setPending] = useState<UpgradeRequest | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [txCode, setTxCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const id = getSessionId();
      if (!id) { navigate({ to: "/app" }); return; }
      const p = await loadProfile(id);
      if (!p) { navigate({ to: "/app" }); return; }
      setUser(p);
      setPending(await myPendingUpgrade(p.id));
    })();
  }, [navigate]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  const current = getTier(user.tier);
  const available = TIERS.filter((t) => t.priceKsh && TIERS.indexOf(t) > TIERS.indexOf(current));
  const target = selected ? TIERS.find((t) => t.name === selected) : null;

  async function submit() {
    if (!target || !target.priceKsh || !user) return;
    if (txCode.trim().length < 4) { setError("Enter a valid M-Pesa code"); return; }
    setLoading(true); setError(null);
    try {
      await submitUpgrade(user.id, target.name, target.priceKsh, txCode.trim().toUpperCase());
      setSuccess(true);
      setPending(await myPendingUpgrade(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell user={user}>
    <div className="px-5 pt-6 pb-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="size-11 rounded-xl glass flex items-center justify-center active:scale-95">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Account</p>
          <h1 className="text-xl font-bold">Upgrade your tier</h1>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current tier</p>
          <p className="text-lg font-semibold text-gradient-gold">{current.name}</p>
        </div>
        <Crown className="size-7 text-gold" />
      </div>

      {pending && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <Clock className="size-5 text-gold shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Upgrade pending review</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your request to {pending.requested_tier} (KSh {Number(pending.amount_paid).toLocaleString()},
              code {pending.transaction_code}) is awaiting admin approval.
            </p>
          </div>
        </div>
      )}

      {success && !pending && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <CheckCircle2 className="size-5 text-primary" />
          <p className="text-sm">Request submitted. Our admin team will review it shortly.</p>
        </div>
      )}

      {!pending && (
        <>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Choose a tier</p>
          <div className="space-y-3 mb-5">
            {available.length === 0 && (
              <p className="text-sm text-muted-foreground">You're already on the highest tier.</p>
            )}
            {available.map((t) => (
              <motion.button
                key={t.name}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(t.name)}
                className={`w-full text-left glass rounded-2xl p-4 border transition ${
                  selected === t.name ? "border-gold shadow-gold" : "border-border/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.dailyLimit} units/day · {t.pointsPerUnit} pts/unit
                      {t.dailyBonus ? ` · +${t.dailyBonus} daily bonus` : ""}
                    </p>
                  </div>
                  <p className="text-gradient-gold font-bold text-lg">
                    KSh {t.priceKsh!.toLocaleString()}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {target && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
              <p className="text-sm font-semibold mb-1">Pay KSh {target.priceKsh!.toLocaleString()} via M-Pesa</p>
              <p className="text-xs text-muted-foreground mb-4">
                Send to <span className="font-mono text-foreground">Paybill 247247 · Acct LOGIBACK</span>, then enter the confirmation code below.
              </p>
              <input
                type="text"
                value={txCode}
                onChange={(e) => setTxCode(e.target.value.toUpperCase())}
                placeholder="Transaction code e.g. QJ7..."
                className="w-full h-14 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" /> {error}
                </div>
              )}
              <button
                onClick={submit}
                disabled={loading}
                className="mt-4 w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-semibold shadow-gold disabled:opacity-60 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : "Submit upgrade request"}
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
    </AppShell>
  );
}
