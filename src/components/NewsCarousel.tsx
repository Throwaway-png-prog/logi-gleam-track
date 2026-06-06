import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Trophy } from "lucide-react";

const SLIDES = [
  {
    icon: Sparkles,
    title: "New AI training jobs available",
    body: "Image tagging & sentiment tasks for VIP 3+ reviewers.",
    grad: "from-primary/30 via-primary/10 to-transparent",
    accent: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Double-points weekend",
    body: "Earn 2× on every approved review Sat–Sun.",
    grad: "from-gold/30 via-gold/10 to-transparent",
    accent: "text-gold",
  },
  {
    icon: Trophy,
    title: "Top earner cleared KSh 75,000 this month",
    body: "Climb the team leaderboard — bonus 5% for active teams.",
    grad: "from-[oklch(0.55_0.15_240/0.30)] via-[oklch(0.55_0.15_240/0.10)] to-transparent",
    accent: "text-[oklch(0.65_0.18_240)]",
  },
];

export function NewsCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);
  const s = SLIDES[i];
  const Icon = s.icon;
  return (
    <div className="mb-5 rounded-2xl glass overflow-hidden border border-border/50">
      <div className={`relative h-24 bg-gradient-to-br ${s.grad}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center gap-3 px-4"
          >
            <div className={`size-12 rounded-xl bg-background/40 flex items-center justify-center ${s.accent}`}>
              <Icon className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground truncate">{s.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-1.5 py-2 bg-background/30">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-gold" : "w-1.5 bg-muted-foreground/40"}`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
