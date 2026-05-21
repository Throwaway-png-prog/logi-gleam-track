import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Trophy, TrendingUp, Crown } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { ScanButton } from "./ScanButton";
import { ActivityFeed } from "./ActivityFeed";
import {
  addLog, generateBatch, getRecentLogs, getTodayUnits, saveUser, resetAll,
  type User, type LogEntry,
} from "@/lib/db";
import { getTier, getNextTier } from "@/lib/tiers";

export function Dashboard({ user, setUser, onLogout }: {
  user: User; setUser: (u: User) => void; onLogout: () => void;
}) {
  const [today, setToday] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const tier = useMemo(() => getTier(user.totalUnits), [user.totalUnits]);
  const nextTier = getNextTier(tier.name);

  useEffect(() => {
    (async () => {
      setToday(await getTodayUnits());
      setLogs(await getRecentLogs());
    })();
  }, []);

  // Supervisor daily bonus
  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (tier.dailyBonus && user.bonusGivenOn !== todayKey) {
      const updated: User = {
        ...user,
        totalPoints: user.totalPoints + tier.dailyBonus,
        bonusGivenOn: todayKey,
      };
      setUser(updated);
      saveUser(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier.name]);

  const remaining = Math.max(0, tier.dailyLimit - today);
  const progress = Math.min(100, (today / tier.dailyLimit) * 100);

  // pleasant fake stats
  const weekUnits = useMemo(() => 342 + (user.totalUnits % 250), [user.totalUnits]);
  const rank = useMemo(() => Math.max(3, 42 - Math.floor(user.totalUnits / 80)), [user.totalUnits]);

  async function handleScan() {
    const entry: LogEntry = {
      batch: generateBatch(),
      timestamp: Date.now(),
      points: tier.pointsPerUnit,
      tier: tier.name,
    };
    await addLog(entry);
    const updated: User = {
      ...user,
      totalUnits: user.totalUnits + 1,
      totalPoints: user.totalPoints + tier.pointsPerUnit,
    };
    setUser(updated);
    await saveUser(updated);
    setToday((n) => n + 1);
    setLogs(await getRecentLogs());
  }

  async function handleLogout() {
    await resetAll();
    onLogout();
  }

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Worker</p>
          <p className="font-mono font-semibold text-lg">{user.id}</p>
        </div>
        <button
          onClick={handleLogout}
          className="size-11 rounded-xl glass flex items-center justify-center text-muted-foreground active:scale-95 transition"
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
        </button>
      </div>

      {/* Tier card */}
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
            <AnimatedCounter value={user.totalPoints} className="text-3xl font-bold text-gradient-primary" />
          </div>
        </div>

        {/* Today progress */}
        <div className="mt-5 relative">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Today's units</span>
            <span className="font-semibold">
              <AnimatedCounter value={today} />/{tier.dailyLimit}
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
            <p className="text-xs text-muted-foreground mt-2">
              {nextTier.unlockAt - user.totalUnits} units to unlock{" "}
              <span className="text-gold font-medium">{nextTier.name}</span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
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

      {/* Scan */}
      <div className="mb-6">
        <ScanButton
          disabled={remaining === 0}
          pointsPerUnit={tier.pointsPerUnit}
          remaining={remaining}
          onScan={handleScan}
        />
      </div>

      <ActivityFeed logs={logs} />
    </div>
  );
}
