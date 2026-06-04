import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, CheckCircle2, X, AtSign, ShieldCheck } from "lucide-react";
import { requestEmailOtp, verifyEmailOtp, type Profile } from "@/lib/api";
import { toast } from "sonner";

export function EmailVerifyModal({
  user, open, onClose, onVerified,
}: {
  user: Profile;
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [step, setStep] = useState<"email" | "code">(user.email ? "code" : "email");
  const [email, setEmail] = useState(user.email ?? "");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendCode() {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr("Enter a valid email address"); return; }
    setLoading(true); setErr(null);
    try {
      const { devCode } = await requestEmailOtp(user.id, email);
      if (devCode) {
        setDevCode(devCode);
        toast.info(`Verification code: ${devCode}`, { duration: 15000, description: "Email delivery not configured — code shown here for now." });
      }
      setStep("code");
    } catch (e: any) { setErr(e?.message ?? "Could not send code"); }
    finally { setLoading(false); }
  }

  async function verify() {
    setLoading(true); setErr(null);
    try {
      const ok = await verifyEmailOtp(user.id, code.trim());
      if (!ok) { setErr("Invalid or expired code"); return; }
      toast.success("Email verified");
      onVerified();
      onClose();
    } catch (e: any) { setErr(e?.message ?? "Verification failed"); }
    finally { setLoading(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass rounded-3xl p-6 shadow-elegant relative"
          >
            <button onClick={onClose} className="absolute right-4 top-4 size-9 rounded-full bg-background/60 flex items-center justify-center">
              <X className="size-4" />
            </button>

            <div className="size-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-3">
              <ShieldCheck className="size-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Verify your email</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Required to withdraw funds. We'll send a 6-digit code.
            </p>

            {step === "email" && (
              <>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {err && <p className="text-xs text-destructive mt-2">{err}</p>}
                <button onClick={sendCode} disabled={loading}
                  className="mt-5 w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="size-5 animate-spin" /> : <><Mail className="size-4" /> Send code</>}
                </button>
              </>
            )}

            {step === "code" && (
              <>
                <p className="text-xs text-muted-foreground mb-2">Sent to <span className="font-mono text-foreground">{email}</span></p>
                {devCode && (
                  <div className="mb-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs">
                    <span className="text-gold font-semibold">Dev code:</span> <span className="font-mono">{devCode}</span>
                  </div>
                )}
                <input
                  type="tel" inputMode="numeric" value={code} maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full h-14 px-4 rounded-xl bg-input border border-border text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {err && <p className="text-xs text-destructive mt-2">{err}</p>}
                <button onClick={verify} disabled={loading || code.length !== 6}
                  className="mt-5 w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="size-5 animate-spin" /> : <><CheckCircle2 className="size-4" /> Verify</>}
                </button>
                <button onClick={() => { setStep("email"); setCode(""); setDevCode(null); }}
                  className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground">
                  Use a different email
                </button>
                <button onClick={sendCode} disabled={loading}
                  className="mt-1 w-full text-xs text-gold hover:underline">
                  Resend code
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
