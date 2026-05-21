import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Crown, ArrowUpRight, Wrench, Wallet, Briefcase, Coins } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AnimatedCounter } from "./AnimatedCounter";
import { JobsFeed } from "./JobsFeed";
import {
  loadProfile, getMaintenance, setSessionId, listJobs, todaysCompletions,
  type Profile, type Job,
} from "@/lib/api";
import { getTier, getNextTier } from "@/lib/tiers";

export function Dashboard({ user, setUser, onLogout }: {
  user: Profile; setUser: (u: Profile) => void; onLogout: () => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [maintenance, setMaint] = useState(false);
  const [loading, setLoading] = useState(true);
  const tier = useMemo(() => getTier(user.tier), [user.tier]);
  const nextTier = getNextTier(tier.name);

  useEffect(() => {
    (async () => {
      const [fresh, allJobs, todays, maint] = await Promise.all([
        loadProfile(user.id), listJobs(), todaysCompletions(user.id), getMaintenance(),
      ]);
      if (fresh) setUser(fresh);
      setJobs(allJobs);
      setCompletedToday(new Set(todays.map((c) => c.job_id)));
      setMaint(maint);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = Math.max(0, tier.dailyLimit - user.units_today);
  const progress = Math.min(100, (user.units_today / tier.dailyLimit) * 100);
  const dailyCapReached = remaining === 0;
  const locked = maintenance || dailyCapReached;
  const lockReason = maintenance ? "System in maintenance" : "Daily limit reached";

  const initials = (user.full_name || "W")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 max-w-xl mx-auto">
      {maintenance && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <Wrench className="size-5 text-gold shrink-0" />
          <div>
            <p className="font-semibold text-sm">System under maintenance</p>
            <p className="text-xs text-muted-foreground">New jobs are temporarily on hold.</p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-12 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role} · <span className="font-mono">{user.worker_id}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => { setSessionId(null); onLogout(); }}
          className="size-11 rounded-xl glass flex items-center justify-center text-muted-foreground active:scale-95 transition"
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
        </button>
      </div>

      {/* Slogan */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-2xl p-4 border border-gold/30 bg-gradient-to-br from-gold/10 via-primary/5 to-transparent relative overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 size-32 rounded-full bg-gold/20 blur-3xl" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-semibold">Today's mission</p>
        <p className="text-lg font-bold leading-tight mt-1">
          Every task you finish is <span className="text-gradient-gold">real money</span> in your pocket.
        </p>
        <p className="text-xs text-muted-foreground mt-1">Pick a job. Crush it. Cash out.</p>
      </motion.div>

      {/* Tier + points card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-5 shadow-elegant mb-5 relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-primary opacity-20 blur-2xl" />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Tier</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2">
              {tier.name === "Supervisor" && <Crown className="size-5 text-gold" />}
              <span className="text-gradient-gold">{tier.name}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {tier.dailyLimit} {tier.dailyLimit === 1 ? "job" : "jobs"} / day
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Points</p>
            <AnimatedCounter value={user.points} className="text-3xl font-bold text-gradient-primary" />
            <p className="text-xs text-muted-foreground mt-0.5">≈ KSh {user.points.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-5 relative">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Today's jobs</span>
            <span className="font-semibold">
              <AnimatedCounter value={user.units_today} />/{tier.dailyLimit}
            </span>
          </div>
          <div className="h-3 rounded-full bg-background/60 overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="h-full bg-gradient-primary shadow-glow"
            />
          </div>
          {nextTier && (
            <Link
              to="/upgrade"
              className="mt-3 flex items-center justify-between rounded-xl border border-gold/30 bg-gold/5 p-3 active:scale-[0.99] transition"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-gold">Next tier</p>
                <p className="text-sm">
                  Unlock <span className="font-semibold">{nextTier.name}</span> · KSh {nextTier.priceKsh?.toLocaleString()}
                </p>
              </div>
              <ArrowUpRight className="size-5 text-gold" />
            </Link>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <Briefcase className="size-3.5 text-primary" /> Done today
          </div>
          <p className="mt-2 text-2xl font-bold">{user.units_today}</p>
          <p className="text-xs text-muted-foreground">of {tier.dailyLimit}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <Coins className="size-3.5 text-gold" /> Cash value
          </div>
          <p className="mt-2 text-2xl font-bold text-gradient-gold">KSh {user.points.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">redeemable balance</p>
        </div>
      </div>

      <Link
        to="/redeem"
        className="mb-6 flex items-center justify-between glass rounded-2xl p-4 border border-gold/30 active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
            <Wallet className="size-5 text-gold-foreground" />
          </div>
          <div>
            <p className="font-semibold">Redeem points</p>
            <p className="text-xs text-muted-foreground">Cash out · 1 pt = KSh 1</p>
          </div>
        </div>
        <ArrowUpRight className="size-5 text-gold" />
      </Link>

      {loading ? (
        <div className="py-10 flex justify-center">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <JobsFeed
          jobs={jobs}
          user={user}
          setUser={setUser}
          completedIds={completedToday}
          addCompleted={(id) => setCompletedToday((s) => new Set(s).add(id))}
          locked={locked}
          lockReason={lockReason}
        />
      )}
    </div>
  );
}
