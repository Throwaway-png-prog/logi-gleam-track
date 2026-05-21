import { motion, AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import { formatTime, type LogEntry } from "@/lib/api";

export function ActivityFeed({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Recent activity</h3>
        <span className="text-xs text-muted-foreground">{logs.length}</span>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No units scanned yet.</p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {logs.map((l) => (
              <motion.li
                key={l.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-xl bg-background/40 border border-border/60 p-3"
              >
                <div className="size-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Package className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{l.batch_number}</p>
                  <p className="text-xs text-muted-foreground">logged at {formatTime(l.created_at)}</p>
                </div>
                <span className="text-sm font-semibold text-gold">+{l.points_earned}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
