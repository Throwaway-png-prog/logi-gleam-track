import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Lock, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { completeJob, type Job, type Profile } from "@/lib/api";
import { chime, haptic } from "@/lib/feedback";

export function JobsFeed({
  jobs, user, setUser, completedIds, addCompleted, locked, lockReason,
}: {
  jobs: Job[];
  user: Profile;
  setUser: (u: Profile) => void;
  completedIds: Set<string>;
  addCompleted: (jobId: string) => void;
  locked: boolean;
  lockReason: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handle(job: Job) {
    if (busyId || locked || completedIds.has(job.id)) return;
    setBusyId(job.id);
    haptic();
    try {
      const updated = await completeJob(user, job);
      setUser(updated);
      addCompleted(job.id);
      chime();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-gold" /> Available jobs
        </h3>
        <span className="text-xs text-muted-foreground">{jobs.length} live</span>
      </div>

      <ul className="space-y-3">
        {jobs.map((j, i) => {
          const done = completedIds.has(j.id);
          const disabled = locked || done;
          return (
            <motion.li
              key={j.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="glass rounded-2xl overflow-hidden border border-border/60"
            >
              <div className="flex">
                <div
                  className="w-28 h-28 shrink-0 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${j.image_url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-background/0 to-background/40" />
                </div>
                <div className="flex-1 min-w-0 p-3 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">{j.category}</p>
                      <p className="font-semibold text-sm leading-snug truncate">{j.title}</p>
                    </div>
                    <span className="text-sm font-bold text-gradient-gold whitespace-nowrap">+{j.points}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{j.description}</p>
                  <button
                    onClick={() => handle(j)}
                    disabled={disabled || busyId === j.id}
                    className={`mt-2 self-start h-9 px-4 rounded-lg text-xs font-semibold transition flex items-center gap-1.5
                      ${done
                        ? "bg-primary/15 text-primary"
                        : disabled
                          ? "bg-muted text-muted-foreground"
                          : "bg-gradient-primary text-primary-foreground shadow-glow active:scale-95"}`}
                  >
                    {busyId === j.id ? <Loader2 className="size-3.5 animate-spin" /> :
                      done ? <><CheckCircle2 className="size-3.5" /> Done</> :
                      locked ? <><Lock className="size-3.5" /> Locked</> :
                      "Complete job"}
                  </button>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {locked && (
        <Link
          to="/upgrade"
          className="mt-4 flex items-center justify-between rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-4 active:scale-[0.99] transition"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-gold font-semibold">{lockReason}</p>
            <p className="text-sm mt-0.5">Upgrade your tier to unlock more jobs today.</p>
          </div>
          <ArrowUpRight className="size-5 text-gold" />
        </Link>
      )}
    </div>
  );
}
