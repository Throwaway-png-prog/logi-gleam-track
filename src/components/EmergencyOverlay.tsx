import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { getEmergency, type EmergencyState } from "@/lib/api";

const PUBLIC_PATHS = ["/", "/terms", "/privacy"];
const POLL_MS = 5000;

export function EmergencyOverlay() {
  const location = useLocation();
  const [state, setState] = useState<EmergencyState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [secured, setSecured] = useState(false);

  // Don't show on landing/legal pages
  const onPublic = PUBLIC_PATHS.includes(location.pathname);

  useEffect(() => {
    if (onPublic) return;
    let cancelled = false;
    async function tick() {
      try {
        const s = await getEmergency();
        if (!cancelled) setState(s);
      } catch { /* ignore */ }
    }
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [onPublic]);

  useEffect(() => {
    if (!state?.active) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [state?.active]);

  if (onPublic || !state?.active || !state.started_at) return null;

  const started = new Date(state.started_at).getTime();
  const elapsed = Math.floor((now - started) / 1000);
  const remaining = Math.max(0, state.duration_seconds - elapsed);

  if (remaining === 0 && !secured) {
    setTimeout(() => setSecured(true), 50);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-red-900 via-red-800 to-black flex flex-col items-center justify-center px-6 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.25),transparent_70%)] animate-pulse" />
      <div className="relative max-w-md">
        {!secured ? (
          <>
            <div className="mx-auto size-20 rounded-full bg-red-600 flex items-center justify-center mb-6 shadow-2xl animate-pulse">
              <AlertTriangle className="size-12" />
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-red-200">Priority alert</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">🚨 EMERGENCY ALERT 🚨</h1>
            <p className="mt-6 text-base whitespace-pre-line text-red-50/95 leading-relaxed">
              {state.message}
            </p>
            <div className="mt-10">
              <div className="text-7xl font-black tabular-nums">{remaining}</div>
              <p className="text-xs uppercase tracking-widest text-red-200 mt-1">seconds remaining</p>
            </div>
            <p className="mt-8 text-xs text-red-200">Do not close this screen. Stay until the countdown ends.</p>
          </>
        ) : (
          <>
            <div className="mx-auto size-20 rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-2xl">
              <ShieldCheck className="size-12" />
            </div>
            <h2 className="text-2xl font-bold">System secured</h2>
            <p className="text-sm text-red-100/80 mt-2">Redirecting you back to your dashboard…</p>
            <button
              onClick={() => { setSecured(false); setState(null); }}
              className="mt-8 h-12 px-8 rounded-xl bg-white text-red-700 font-bold"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
