let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function chime() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  [880, 1320].forEach((freq, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.05 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.25);
    o.connect(g).connect(c.destination);
    o.start(now + i * 0.05);
    o.stop(now + i * 0.05 + 0.3);
  });
}

export function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([12, 8, 18]);
  }
}
