import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "logiback.install_dismissed_at";
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed → don't prompt
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    if (standalone) return;

    // Dismissed recently?
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || "0");
    if (dismissed && Date.now() - dismissed < DISMISS_DAYS * 86400 * 1000) return;

    function onBIP(e: Event) {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari fallback (no beforeinstallprompt)
    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS && isSafari) {
      setIosHint(true);
      const t = setTimeout(() => setVisible(true), 2500);
      return () => { clearTimeout(t); window.removeEventListener("beforeinstallprompt", onBIP); };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="glass rounded-2xl p-4 shadow-elegant border border-gold/40 flex items-center gap-3">
            <div className="size-11 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold shrink-0">
              <Download className="size-5 text-gold-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm">Install LogiBack Earn</p>
              {iosHint ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  Tap <Share className="size-3 inline" /> Share → <Plus className="size-3 inline" /> Add to Home Screen
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Add to your home screen for the full app experience.</p>
              )}
            </div>
            {!iosHint && deferred && (
              <button onClick={install} className="h-10 px-4 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow shrink-0">
                Install
              </button>
            )}
            <button onClick={dismiss} aria-label="Dismiss" className="size-9 rounded-lg glass flex items-center justify-center shrink-0">
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Returns true if the app is running as an installed PWA. */
export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(display-mode: standalone)");
    const check = () => setStandalone(mq.matches || (window.navigator as any).standalone === true);
    check();
    mq.addEventListener?.("change", check);
    return () => mq.removeEventListener?.("change", check);
  }, []);
  return standalone;
}
