import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Trophy, TrendingUp, Crown, ArrowUpRight, Wrench, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AnimatedCounter } from "./AnimatedCounter";
import { ScanButton } from "./ScanButton";
import { ActivityFeed } from "./ActivityFeed";
import {
  loadProfile, logUnit, recentLogs, getMaintenance, setSessionId,
  type Profile, type LogEntry,
} from "@/lib/api";
import { getTier, getNextTier } from "@/lib/tiers";

export function Dashboard({ user, setUser, onLogout }: {
  user: Profile; setUser: (u: Profile) => void; onLogout: () => void;
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [maintenance, setMaint] = useState(false);
  const tier = useMemo(() => getTier(user.tier), [user.tier]);
  const nextTier = getNextTier(tier.name);

  useEffect(() => {
    (async () => {
      const fresh = await loadProfile(user.id);
      if (fresh) setUser(fresh);
      setLogs(await recentLogs(user.id));
      setMaint(await getMaintenance());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = Math.max(0, tier.dailyLimit - user.units_today);
  const progress = Math.min(100, (user.units_today / tier.dailyLimit) * 100);
  const weekUnits = useMemo(() => 120 + (user.points % 400), [user.points]);
  const rank = useMemo(() => Math.max(3, 42 - Math.floor(user.points / 5000)), [user.points]);

  async function handleScan() {
    const updated = await logUnit(user, tier.pointsPerUnit);
    setUser(updated);
    setLogs(await recentLogs(user.id));
  }

  function handleLogout() {
    setSessionId(null);
    onLogout();
  }

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 max-w-xl mx-auto">
      {maintenance && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <Wrench className="size-5 text-gold shrink-0" />
          <div>
            <p className="font-semibold text-sm">System under maintenance</p>
            <p className="text-xs text-muted-foreground">Logging is temporarily disabled.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Worker</p>
          <p className="font-mono font-semibold text-lg">{user.worker_id}</p>
        </div>
        <button
          onClick={handleLogout}
          className="size-11 rounded-xl glass flex items-center justify-center text-muted-foreground active:scale-95 transition"
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-5 shadow-elegant mb-5 relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-primary opacity-20 blur-2xl" />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Current tier</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2">
              {tier.name === "Supervisor" && <Crown className="size-5 text-gold" />}
              <span className="text-gradient-gold">{tier.name}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {tier.pointsPerUnit} pts / unit{tier.dailyBonus ? ` · +${tier.dailyBonus} daily bonus` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Points</p>
            <AnimatedCounter value={user.points} className="text-3xl font-bold text-gradient-primary" />
          </div>
        </div>

        <div className="mt-5 relative">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Today's units</span>
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
                <p className="text-xs uppercase tracking-wider text-gold">Upgrade available</p>
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
            <TrendingUp className="size-3.5" /> This week
          </div>
          <p className="mt-2 text-2xl font-bold">{weekUnits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">units logged</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <Trophy className="size-3.5 text-gold" /> Rank
          </div>
          <p className="mt-2 text-2xl font-bold text-gradient-gold">#{rank}</p>
          <p className="text-xs text-muted-foreground">this month</p>
        </div>
      </div>

      <div className="mb-6">
        <ScanButton
          disabled={remaining === 0 || maintenance}
          pointsPerUnit={tier.pointsPerUnit}
          remaining={remaining}
          onScan={handleScan}
        />
      </div>

      <ActivityFeed logs={logs} />
    </div>
  );
}
