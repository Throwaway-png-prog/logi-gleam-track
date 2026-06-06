// Public-friendly admin entry that gates with an admin PIN (bcrypt-hashed in DB)
// before redirecting to the existing admin console. The legacy hidden route
// (/x7k2p9m4q1admin) still works for direct access.
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shield, Loader2, AlertCircle, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import bcrypt from "bcryptjs";

export const Route = createFileRoute("/admin")({
  component: AdminGate,
  head: () => ({ meta: [{ title: "Admin — LogiBack" }, { name: "robots", content: "noindex" }] }),
});

const ATTEMPTS_KEY = "logiback.admin_attempts";
const LOCK_KEY = "logiback.admin_lock_until";
const SESSION_KEY = "logiback.admin_session_until";
const MAX_ATTEMPTS = 3;
const LOCK_HOURS = 24;
const SESSION_HOURS = 1;

function ipFingerprint() {
  // Lightweight client-side fingerprint (no real IP). Combined with server
  // table public.admin_ip_lockouts for cross-device throttling if needed.
  let fp = localStorage.getItem("logiback.fp");
  if (!fp) {
    fp = `${navigator.userAgent}|${screen.width}x${screen.height}|${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    localStorage.setItem("logiback.fp", btoa(fp).slice(0, 24));
  }
  return fp;
}

function AdminGate() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState<number | null>(null);

  useEffect(() => {
    // Already authenticated?
    const sess = Number(localStorage.getItem(SESSION_KEY) ?? 0);
    if (sess > Date.now()) { navigate({ to: "/x7k2p9m4q1admin" }); return; }

    // Locked out?
    const lockUntil = Number(localStorage.getItem(LOCK_KEY) ?? 0);
    if (lockUntil > Date.now()) { setLocked(lockUntil); setLoading(false); return; }

    (async () => {
      const { data } = await supabase.from("admin_security" as any).select("pin_hash").eq("id", 1).maybeSingle();
      setPinHash((data as any)?.pin_hash ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  async function setup() {
    if (pin.length !== 6 || !/^\d+$/.test(pin)) { setError("PIN must be 6 digits"); return; }
    const hash = await bcrypt.hash(pin, 10);
    const { error } = await supabase.from("admin_security" as any).update({ pin_hash: hash, pin_set_at: new Date().toISOString() } as any).eq("id", 1);
    if (error) { setError(error.message); return; }
    // Generate 5 recovery codes
    const codes = Array.from({ length: 5 }, () => Math.random().toString(36).slice(2, 10).toUpperCase());
    await Promise.all(codes.map((c) =>
      bcrypt.hash(c, 10).then((h) => supabase.from("admin_recovery_codes" as any).insert({ code_hash: h } as any))
    ));
    alert("Admin PIN set.\n\nSAVE THESE RECOVERY CODES (one-time use):\n\n" + codes.join("\n"));
    setPinHash(hash);
    setPin("");
  }

  async function login() {
    if (!pinHash) return;
    const ok = await bcrypt.compare(pin, pinHash);
    if (!ok) {
      const n = Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0) + 1;
      localStorage.setItem(ATTEMPTS_KEY, String(n));
      if (n >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_HOURS * 3600 * 1000;
        localStorage.setItem(LOCK_KEY, String(until));
        localStorage.removeItem(ATTEMPTS_KEY);
        await supabase.from("admin_ip_lockouts" as any).upsert({
          ip_fingerprint: ipFingerprint(),
          failed_count: n,
          locked_until: new Date(until).toISOString(),
          updated_at: new Date().toISOString(),
        } as any, { onConflict: "ip_fingerprint" } as any);
        setLocked(until);
        return;
      }
      setError(`Incorrect PIN. ${MAX_ATTEMPTS - n} attempt(s) left.`);
      return;
    }
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_HOURS * 3600 * 1000));
    navigate({ to: "/x7k2p9m4q1admin" });
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;

  if (locked) {
    const hrs = Math.ceil((locked - Date.now()) / 3600_000);
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="max-w-sm w-full glass rounded-3xl p-6 text-center border border-destructive/40">
          <AlertCircle className="size-10 mx-auto text-destructive mb-3" />
          <h1 className="font-bold text-lg">Access locked</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Too many failed attempts. Try again in ~{hrs} hour{hrs === 1 ? "" : "s"}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-background">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full glass rounded-3xl p-6 shadow-elegant">
        <div className="size-14 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold mx-auto mb-4">
          <Shield className="size-7 text-gold-foreground" />
        </div>
        <h1 className="text-center font-bold text-xl">Admin access</h1>
        <p className="text-center text-xs text-muted-foreground mt-1">
          {pinHash ? "Enter your 6-digit PIN" : "Set a new admin PIN to continue"}
        </p>
        <div className="mt-5 relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="password" inputMode="numeric" maxLength={6}
            value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(null); }}
            placeholder="••••••"
            className="w-full h-14 pl-10 pr-4 rounded-xl bg-input border border-border text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && (pinHash ? login() : setup())}
          />
        </div>
        {error && <p className="mt-3 text-sm text-destructive flex items-center gap-1.5"><AlertCircle className="size-4" /> {error}</p>}
        <button
          onClick={pinHash ? login : setup}
          disabled={pin.length !== 6}
          className="mt-4 w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-bold disabled:opacity-40 active:scale-[0.98] transition"
        >
          {pinHash ? "Unlock" : "Set PIN & Generate Recovery Codes"}
        </button>
      </motion.div>
    </div>
  );
}
