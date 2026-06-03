import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Loader2, X } from "lucide-react";
import { performSpin, getTodaysSpin, type SpinRecord } from "@/lib/spin";

export function SpinModal({
  userId,
  open,
  onClose,
  onAwarded,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  onAwarded: (amount: number, newBalance: number) => void;
}) {
  const [existing, setExisting] = useState<SpinRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [angle, setAngle] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setResult(null);
    setLoading(true);
    getTodaysSpin(userId).then((r) => {
      setExisting(r);
      if (r) setResult(Number(r.amount_ksh));
      setLoading(false);
    });
  }, [open, userId]);

  async function spin() {
    if (spinning || existing) return;
    setSpinning(true);
    setError(null);
    try {
      const { amount, newBalance } = await performSpin(userId);
      // pick a final angle that loops a few times for animation
      const slice = 360 / 8;
      // visually we don't track exact slices to amounts (decorative); show value at end
      const final = 360 * 6 + Math.floor(Math.random() * 8) * slice;
      setAngle(final);
      setTimeout(() => {
        setResult(amount);
        setSpinning(false);
        onAwarded(amount, newBalance);
      }, 3200);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't spin. Try again.");
      setSpinning(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-gold/30 shadow-elegant"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="size-5 text-gold" />
                <h2 className="font-bold">Daily Spin</h2>
              </div>
              <button onClick={onClose} className="size-9 rounded-lg glass flex items-center justify-center">
                <X className="size-4" />
              </button>
            </div>

            <div className="relative mx-auto w-64 h-64 mb-6">
              {/* Needle */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-gold drop-shadow" />
              </div>
              {/* Wheel */}
              <motion.div
                animate={{ rotate: angle }}
                transition={{ duration: 3.2, ease: [0.17, 0.67, 0.25, 1] }}
                className="absolute inset-0 rounded-full shadow-elegant border-4 border-gold/40"
                style={{
                  background:
                    "conic-gradient(from 0deg, #d4af37 0 45deg, #0e7c66 45deg 90deg, #d4af37 90deg 135deg, #0e7c66 135deg 180deg, #d4af37 180deg 225deg, #0e7c66 225deg 270deg, #d4af37 270deg 315deg, #0e7c66 315deg 360deg)",
                }}
              >
                {/* Labels */}
                {["KSh 10", "KSh 15", "KSh 5", "KSh 20", "KSh 50", "KSh 8", "KSh 30", "KSh 12"].map(
                  (label, i) => (
                    <div
                      key={i}
                      className="absolute left-1/2 top-1/2 text-[11px] font-bold text-background"
                      style={{
                        transform: `rotate(${i * 45 + 22.5}deg) translate(0, -90px) rotate(-${i * 45 + 22.5}deg)`,
                      }}
                    >
                      {label}
                    </div>
                  ),
                )}
              </motion.div>
              <div className="absolute inset-0 m-auto size-16 rounded-full bg-gradient-gold shadow-gold flex items-center justify-center font-bold text-gold-foreground">
                SPIN
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center"><Loader2 className="size-6 animate-spin" /></div>
            ) : existing ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Already spun today.</p>
                <p className="text-2xl font-bold text-gradient-gold">
                  You won KSh {Number(existing.amount_ksh).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Come back tomorrow for another spin.</p>
              </div>
            ) : result !== null && !spinning ? (
              <div className="text-center space-y-2">
                <p className="text-3xl font-bold text-gradient-gold">You won KSh {result.toLocaleString()}!</p>
                <p className="text-xs text-muted-foreground">Come back tomorrow for another spin.</p>
              </div>
            ) : (
              <button
                onClick={spin}
                disabled={spinning}
                className="w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-gold disabled:opacity-50"
              >
                {spinning ? "Spinning..." : "Spin now"}
              </button>
            )}
            {error && <p className="mt-3 text-sm text-destructive text-center">{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
