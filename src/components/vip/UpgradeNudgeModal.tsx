import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, TrendingUp, Clock, Users } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Nudge } from "@/lib/vip";
import { formatKsh } from "@/lib/format";

export function UpgradeNudgeModal({ nudge, onClose }: { nudge: Nudge | null; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {nudge && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass rounded-3xl border border-gold/40 shadow-elegant overflow-hidden">
            <div className="relative h-2 bg-gradient-gold" />
            <button onClick={onClose} className="absolute top-4 right-4 size-9 rounded-lg glass flex items-center justify-center z-10">
              <X className="size-4" />
            </button>
            <div className="p-6 text-center space-y-3">
              {nudge.kind === "exhaustion" && (
                <>
                  <div className="mx-auto size-14 rounded-2xl bg-gold/15 flex items-center justify-center">
                    <Sparkles className="size-7 text-gold" />
                  </div>
                  <h3 className="font-bold text-xl">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    You've completed every job for your tier. Upgrade to <span className="text-gold font-semibold">VIP {nudge.nextLevel}</span> to unlock a new daily job worth <span className="text-gold font-semibold">{formatKsh(nudge.nextRewardKsh)}/day</span>.
                  </p>
                </>
              )}
              {nudge.kind === "comparison" && (
                <>
                  <div className="mx-auto size-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <TrendingUp className="size-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">VIP {nudge.nextLevel} earners pulled ahead</h3>
                  <p className="text-sm text-muted-foreground">
                    They made <span className="text-gold font-semibold">{formatKsh(nudge.nextWeeklyKsh)}</span> this week.
                    You made <span className="text-foreground font-semibold">{formatKsh(nudge.weeklyEarnedKsh)}</span>.
                    Upgrade now to boost earnings by <span className="text-gold font-bold">{nudge.uplift}%</span>.
                  </p>
                </>
              )}
              {nudge.kind === "limited" && (
                <>
                  <div className="mx-auto size-14 rounded-2xl bg-gradient-gold flex items-center justify-center">
                    <Clock className="size-7 text-gold-foreground" />
                  </div>
                  <h3 className="font-bold text-xl">24-hour bonus</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to <span className="text-gold font-semibold">VIP {nudge.nextLevel}</span> in the next 24 hours and get an instant
                    <span className="text-gold font-bold"> {formatKsh(nudge.bonusKsh)} bonus </span>
                    credited to your balance.
                  </p>
                </>
              )}
              {nudge.kind === "referral" && (
                <>
                  <div className="mx-auto size-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <Users className="size-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">Earn 15% on referrals</h3>
                  <p className="text-sm text-muted-foreground">
                    Refer a friend who upgrades to VIP 1 and get <span className="text-gold font-bold">{formatKsh(nudge.bonusKsh)}</span> credited instantly.
                  </p>
                </>
              )}
              <button
                onClick={() => { onClose(); navigate({ to: "/vip" }); }}
                className="w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-gold mt-2">
                {nudge.kind === "referral" ? "Get referral link" : "View upgrade"}
              </button>
              <button onClick={onClose} className="text-xs text-muted-foreground">Maybe later</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
