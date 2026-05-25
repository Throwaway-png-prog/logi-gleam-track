import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] px-3 h-9 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold flex items-center gap-1.5 shadow-elegant">
          <WifiOff className="size-3.5" /> You're offline
        </motion.div>
      )}
    </AnimatePresence>
  );
}
