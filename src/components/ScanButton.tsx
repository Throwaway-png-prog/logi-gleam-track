import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Loader2, Lock } from "lucide-react";
import { chime, haptic } from "@/lib/feedback";

interface Pop { id: number; value: number }

export function ScanButton({
  disabled,
  pointsPerUnit,
  onScan,
  remaining,
}: {
  disabled: boolean;
  pointsPerUnit: number;
  onScan: () => Promise<void> | void;
  remaining: number;
}) {
  const [busy, setBusy] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);

  async function handle() {
    if (disabled || busy) return;
    setBusy(true);
    haptic();
    chime();
    const id = Date.now() + Math.random();
    setPops((p) => [...p, { id, value: pointsPerUnit }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1200);
    try { await onScan(); } finally { setBusy(false); }
  }

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {pops.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 -top-2 z-20 text-gradient-gold font-bold text-3xl"
            style={{ animation: "float-up 1.2s ease-out forwards" }}
          >
            +{p.value}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={handle}
        disabled={disabled || busy}
        className={`relative w-full max-w-sm h-44 rounded-[2rem] overflow-hidden text-primary-foreground font-bold tracking-wider
          ${disabled ? "bg-muted text-muted-foreground" : "bg-gradient-primary shadow-glow animate-[pulse-glow_2.4s_ease-in-out_infinite]"}
          active:shadow-none transition-shadow`}
      >
        {!disabled && <span className="absolute inset-0 shimmer opacity-40 pointer-events-none" />}
        <div className="relative flex flex-col items-center justify-center gap-3 h-full">
          {disabled ? (
            <>
              <Lock className="size-9" />
              <span className="text-lg">Daily limit reached</span>
            </>
          ) : busy ? (
            <Loader2 className="size-10 animate-spin" />
          ) : (
            <>
              <ScanLine className="size-12" strokeWidth={2.2} />
              <span className="text-xl">SCAN &amp; LOG UNIT</span>
              <span className="text-xs font-medium opacity-80">+{pointsPerUnit} pts · {remaining} left today</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  );
}
