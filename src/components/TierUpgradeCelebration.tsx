import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X } from "lucide-react";
import { getTier } from "@/lib/tiers";

export function TierUpgradeCelebration({ tierName, open, onClose }: {
  tierName: string | null; open: boolean; onClose: () => void;
}) {
  const tier = tierName ? getTier(tierName) : null;

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && tier && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-5"
          onClick={onClose}
        >
          {/* Confetti dots */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.span key={i}
              initial={{ y: -50, x: Math.random() * 400 - 200, opacity: 1 }}
              animate={{ y: 800, rotate: Math.random() * 720, opacity: 0 }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, repeat: Infinity }}
              className="absolute size-2 rounded-full"
              style={{ background: ["#FFD700", "#00843D", "#fff", "#e85d3a"][i % 4] }}
            />
          ))}
          <motion.div
            initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full glass rounded-3xl p-8 text-center border border-gold/50 shadow-gold"
          >
            <button onClick={onClose} className="absolute top-3 right-3 size-8 rounded-lg glass flex items-center justify-center">
              <X className="size-4" />
            </button>
            <motion.div
              initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
              className="size-20 rounded-full bg-gradient-gold flex items-center justify-center mx-auto shadow-gold"
            >
              <Crown className="size-10 text-gold-foreground" />
            </motion.div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold mt-5">Congratulations</p>
            <h2 className="text-3xl font-bold mt-1">{tier.name} unlocked</h2>
            <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
            <div className="mt-5 space-y-2 text-left">
              {tier.perks.map((p) => (
                <div key={p} className="flex items-start gap-2 text-sm">
                  <span className="text-gold">✦</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="mt-6 w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-gold">
              Start earning
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
