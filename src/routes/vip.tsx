import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Lock, CheckCircle2, Loader2, X, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getSessionId, loadProfile, type Profile } from "@/lib/api";
import {
  listVipJobs, myTodayCompletions, hasClaimedVip0, claimVipJob,
  myPendingVipUpgrade, type VipJob, type VipCompletion, type VipUpgradeRequest,
} from "@/lib/vip";
import { renderTask } from "@/components/vip/tasks";
import { VipUpgradeModal } from "@/components/vip/VipUpgradeModal";
import { formatKsh } from "@/lib/format";

export const Route = createFileRoute("/vip")({
  component: VipPage,
  head: () => ({ meta: [{ title: "VIP Jobs — LogiBack Earn" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ level: typeof s.level === "string" ? Number(s.level) : (typeof s.level === "number" ? s.level : undefined) }),
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">Couldn't load VIP jobs: {error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Not found.</div>,
});

function VipPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<VipJob[]>([]);
  const [todayDone, setTodayDone] = useState<VipCompletion[]>([]);
  const [vip0Done, setVip0Done] = useState(false);
  const [pending, setPending] = useState<VipUpgradeRequest | null>(null);
  const [activeTask, setActiveTask] = useState<VipJob | null>(null);
  const [upgradeFor, setUpgradeFor] = useState<VipJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh(p: Profile) {
    const [j, t, v0, pen] = await Promise.all([
      listVipJobs(), myTodayCompletions(p.id), hasClaimedVip0(p.id), myPendingVipUpgrade(p.id),
    ]);
    setJobs(j); setTodayDone(t); setVip0Done(v0); setPending(pen);
    const fresh = await loadProfile(p.id);
    if (fresh) setUser(fresh);
  }

  useEffect(() => {
    const id = getSessionId();
    if (!id) { navigate({ to: "/app" }); return; }
    (async () => {
      const p = await loadProfile(id);
      if (!p) { navigate({ to: "/app" }); return; }
      setUser(p);
      await refresh(p);
    })();
  }, [navigate]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  const vipLevel = (user as any).vip_level ?? 0;

  async function handleComplete(payload: unknown) {
    if (!activeTask || !user) return;
    setBusy(true);
    try {
      const { newBalance } = await claimVipJob({ userId: user.id, job: activeTask, payload });
      setToast(`+${formatKsh(Number(activeTask.reward_ksh))} credited!`);
      setTimeout(() => setToast(null), 3000);
      setActiveTask(null);
      await refresh(user);
      void newBalance;
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed");
      setTimeout(() => setToast(null), 3000);
    } finally { setBusy(false); }
  }

  return (
    <AppShell user={user}>
      <div className="px-5 pt-5 pb-8 max-w-xl mx-auto">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Gated Job Ladder</p>
          <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
            <Crown className="size-6 text-gold" /> VIP Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You are <span className="text-gold font-semibold">VIP {vipLevel}</span>. Upgrade to unlock higher-paying daily tasks.
          </p>
        </div>

        {pending && (
          <div className="mb-4 glass rounded-2xl p-4 border border-gold/40 bg-gold/10">
            <p className="text-sm font-semibold">Upgrade to VIP {pending.to_vip} pending review</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tx code <span className="font-mono text-foreground">{pending.transaction_code}</span> · {formatKsh(Number(pending.amount_ksh))}</p>
          </div>
        )}

        <div className="space-y-3">
          {jobs.map((j) => {
            const claimedToday = todayDone.some((c) => c.vip_level === j.vip_level);
            const isVip0Done = j.is_one_time && j.vip_level === 0 && vip0Done;
            const done = claimedToday || isVip0Done;
            const locked = j.vip_level > vipLevel;

            return (
              <motion.div key={j.id} layout
                className={`glass rounded-2xl p-4 border ${
                  locked ? "border-border/30 opacity-70" : done ? "border-primary/40" : "border-gold/40"
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                    done ? "bg-primary/20" : locked ? "bg-muted/30" : "bg-gradient-gold shadow-gold"
                  }`}>
                    {done ? <CheckCircle2 className="size-6 text-primary" /> :
                     locked ? <Lock className="size-5 text-muted-foreground" /> :
                     <Sparkles className="size-6 text-gold-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">VIP {j.vip_level}</p>
                      {j.is_one_time && <span className="text-[10px] uppercase tracking-wider bg-accent px-1.5 py-0.5 rounded">One-time</span>}
                      {done && <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">Claimed</span>}
                    </div>
                    <p className="font-semibold mt-0.5">{j.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{j.description}</p>
                    <p className="mt-2 text-lg font-bold text-gradient-gold">
                      {formatKsh(Number(j.reward_ksh))}{j.is_one_time ? "" : "/day"}
                    </p>

                    <div className="mt-3">
                      {done ? (
                        <span className="text-xs text-primary font-semibold">
                          {j.is_one_time ? "Bonus claimed" : "Come back tomorrow for next payout"}
                        </span>
                      ) : locked ? (
                        <button
                          onClick={() => setUpgradeFor(j)}
                          disabled={!!pending}
                          className="w-full h-10 rounded-xl bg-gradient-gold text-gold-foreground text-sm font-bold shadow-gold disabled:opacity-50">
                          Upgrade to VIP {j.vip_level} · {formatKsh(Number(j.upgrade_fee_ksh ?? 0))}
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTask(j)}
                          className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-[0.98]">
                          Start task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active task modal */}
      <AnimatePresence>
        {activeTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !busy && setActiveTask(null)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl border border-gold/40 max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">VIP {activeTask.vip_level}</p>
                  <h3 className="font-bold">{activeTask.name}</h3>
                </div>
                <button disabled={busy} onClick={() => setActiveTask(null)} className="size-9 rounded-lg glass flex items-center justify-center disabled:opacity-50">
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-5">
                {renderTask(activeTask.task_kind, { onComplete: handleComplete, busy })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {upgradeFor && (
        <VipUpgradeModal
          open
          onClose={() => setUpgradeFor(null)}
          userId={user.id}
          currentVip={vipLevel}
          targetJob={upgradeFor}
          onSubmitted={() => { refresh(user); setToast("Upgrade submitted for review"); setTimeout(() => setToast(null), 3000); }}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-gradient-gold text-gold-foreground px-5 py-3 rounded-full font-bold shadow-gold">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
