import { useEffect } from "react";
import { setSessionId } from "@/lib/api";

const IDLE_MS = 30 * 60 * 1000;

export function IdleTimeout({ onTimeout }: { onTimeout: () => void }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function reset() { clearTimeout(timer); timer = setTimeout(() => { setSessionId(null); onTimeout(); }, IDLE_MS); }
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, [onTimeout]);
  return null;
}
