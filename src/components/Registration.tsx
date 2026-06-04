import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, KeyRound, CheckCircle2, Loader2, AlertCircle, User, AtSign, Lock } from "lucide-react";
import { findByPhone, registerProfile, loginProfile, setSessionId, getPendingReferral, setPendingReferral, findProfileByReferralCode, type Profile } from "@/lib/api";
import { checkLockout, logLogin, friendly } from "@/lib/admin";
import { formatPhoneKE } from "@/lib/format";
import { Logo } from "./Logo";

type Step = "phone" | "name" | "display" | "email" | "pin" | "confirm" | "welcome";

export function Registration({ onComplete }: { onComplete: (u: Profile) => void }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [termsOk, setTermsOk] = useState(false);
  const [remember, setRemember] = useState(true);
  const [referralCode] = useState<string | null>(() => getPendingReferral());

  // Lockout / challenge
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [challenge, setChallenge] = useState<{ a: number; b: number } | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");

  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000));
      setCountdown(s);
      if (s === 0) { setLockedUntil(null); setError(null); }
    }, 500);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 9 && phoneDigits.length <= 12;

  async function continuePhone() {
    setLoading(true); setError(null);
    try {
      const lock = await checkLockout(phone);
      if (!lock.allowed && lock.lockedUntil) {
        setLockedUntil(new Date(lock.lockedUntil));
        setError("Too many failed attempts. Try again in a few minutes.");
        return;
      }
      setFailCount(lock.failsRecent);
      const existing = await findByPhone(phone);
      setMode(existing ? "login" : "register");
      setStep(existing ? "pin" : "name");
    } catch (e) {
      setError(friendly(e));
    } finally { setLoading(false); }
  }

  async function submitPin() {
    if (pin.length !== 4) return;
    setLoading(true); setError(null);
    try {
      if (mode === "login") {
        if (failCount >= 2 && challenge) {
          const expected = challenge.a + challenge.b;
          if (Number(challengeAnswer) !== expected) {
            setError("Wrong answer to the security check. Try again.");
            setLoading(false);
            return;
          }
        }
        const u = await loginProfile(phone, pin);
        if (!u) {
          await logLogin(phone, false);
          const next = failCount + 1;
          setFailCount(next);
          if (next >= 5) {
            setLockedUntil(new Date(Date.now() + 5 * 60 * 1000));
            setError("Too many failed attempts. Your account is locked for 5 minutes.");
          } else if (next >= 2) {
            setChallenge({ a: 3 + Math.floor(Math.random() * 7), b: 2 + Math.floor(Math.random() * 8) });
            setChallengeAnswer("");
            setError("That PIN doesn't match. Please answer the security check and try again.");
          } else {
            setError("That PIN doesn't match. Please try again.");
          }
          setLoading(false);
          return;
        }
        // success
        await logLogin(phone, true);
        if (typeof window !== "undefined") {
          const days = remember ? 90 : 30;
          localStorage.setItem("logiback.session_exp", String(Date.now() + days * 86400_000));
        }
        setSessionId(u.id);
        onComplete(u);
        return;
      }
      setStep("confirm"); setLoading(false);
    } catch (e) {
      setError(friendly(e));
      setLoading(false);
    }
  }

  async function finalizeRegistration() {
    if (confirmPin !== pin) { setError("PINs don't match"); return; }
    if (!termsOk) { setError("Please accept Terms & Privacy to continue"); return; }
    setLoading(true); setError(null);
    try {
      let referrerId: string | null = null;
      if (referralCode) {
        const ref = await findProfileByReferralCode(referralCode);
        if (ref) referrerId = ref.id;
      }
      const u = await registerProfile(phone, pin, fullName.trim(), displayName.trim(), {
        referred_by: referrerId, terms_accepted: true, email: email.trim() || null,
      });
      setPendingReferral(null);
      setProfile(u); setSessionId(u.id); setStep("welcome");
    } catch (e) {
      setError(friendly(e));
    } finally { setLoading(false); }
  }

  const locked = lockedUntil && lockedUntil.getTime() > Date.now();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col items-center">
        <Logo size={56} showText={false} />
        <h1 className="text-3xl font-bold tracking-tight mt-4">
          Logi<span className="text-gradient-gold">Back Earn</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Kenya's Trusted Review Platform</p>
      </motion.div>

      <div className="w-full max-w-sm glass rounded-3xl p-6 shadow-elegant">
        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Sign in or register</label>
              <h2 className="text-xl font-semibold mt-1 mb-5">Your phone number</h2>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  type="tel" inputMode="tel" placeholder="0712 345 678"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  disabled={!!locked}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>
              {phone && <p className="mt-2 text-xs text-muted-foreground">Saved as <span className="font-mono text-foreground">{formatPhoneKE(phone)}</span></p>}
              {locked && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <Lock className="size-4" /> Locked. Try again in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                </div>
              )}
              {error && !locked && <ErrorBox msg={error} />}
              <button disabled={!phoneValid || loading || !!locked} onClick={continuePhone}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition flex items-center justify-center gap-2">
                {loading ? <Loader2 className="size-5 animate-spin" /> : "Continue"}
              </button>
            </motion.div>
          )}

          {step === "name" && (
            <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Step 2 of 5</label>
              <h2 className="text-xl font-semibold mt-1 mb-1">Your full name</h2>
              <p className="text-sm text-muted-foreground mb-5">Enter your full name as it appears on ID.</p>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input type="text" autoCapitalize="words" placeholder="e.g. Amina Otieno"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button disabled={fullName.trim().length < 2} onClick={() => setStep("display")}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 active:scale-[0.98] transition">
                Continue
              </button>
            </motion.div>
          )}

          {step === "display" && (
            <motion.div key="display" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Step 3 of 5</label>
              <h2 className="text-xl font-semibold mt-1 mb-1">Pick a display name</h2>
              <p className="text-sm text-muted-foreground mb-5">This is your handle on the leaderboard.</p>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input type="text" placeholder="e.g. AminaO"
                  value={displayName} onChange={(e) => setDisplayName(e.target.value.replace(/\s+/g, "").slice(0, 20))}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button disabled={displayName.trim().length < 3} onClick={() => setStep("email")}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 active:scale-[0.98] transition">
                Continue
              </button>
            </motion.div>
          )}

          {step === "email" && (
            <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Step 4 of 6</label>
              <h2 className="text-xl font-semibold mt-1 mb-1">Your email address</h2>
              <p className="text-sm text-muted-foreground mb-5">Required for withdrawals. We'll verify it later.</p>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value.trim())}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button disabled={!/^\S+@\S+\.\S+$/.test(email)} onClick={() => setStep("pin")}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 active:scale-[0.98] transition">
                Continue
              </button>
            </motion.div>
          )}

          {step === "pin" && (
            <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                {mode === "login" ? "Welcome back" : "Step 4 of 5"}
              </label>
              <h2 className="text-xl font-semibold mt-1 mb-1">
                {mode === "login" ? "Enter your PIN" : "Create a 4-digit PIN"}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {mode === "login" ? "Unlock your account." : "You'll need this on every device."}
              </p>
              <PinInput value={pin} onChange={setPin} />

              {mode === "login" && challenge && failCount >= 2 && (
                <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 p-3">
                  <p className="text-xs text-gold mb-2 flex items-center gap-1"><ShieldIcon /> Security check</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{challenge.a} + {challenge.b} = </span>
                    <input
                      type="tel" inputMode="numeric" value={challengeAnswer}
                      onChange={(e) => setChallengeAnswer(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      className="w-20 h-9 px-2 rounded-lg bg-input border border-border text-center" />
                  </div>
                </div>
              )}

              {mode === "login" && (
                <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[color:var(--primary)]" />
                  Remember this device for 90 days
                </label>
              )}

              {error && <ErrorBox msg={error} />}
              <button disabled={pin.length !== 4 || loading} onClick={submitPin}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 active:scale-[0.98] transition flex items-center justify-center gap-2">
                {loading ? <Loader2 className="size-5 animate-spin" /> : mode === "login" ? "Sign in" : "Continue"}
              </button>
              <button onClick={() => { setStep("phone"); setPin(""); setError(null); setChallenge(null); }}
                className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground">
                Use a different number
              </button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Step 5 of 5</label>
              <h2 className="text-xl font-semibold mt-1 mb-1">Confirm your PIN</h2>
              <p className="text-sm text-muted-foreground mb-5">Type it again to be sure.</p>
              <PinInput value={confirmPin} onChange={setConfirmPin} />

              <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox" checked={termsOk}
                  onChange={(e) => setTermsOk(e.target.checked)}
                  className="mt-0.5 size-5 rounded border-border accent-[color:var(--primary)]"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-gold underline">Terms & Conditions</Link> and{" "}
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-gold underline">Privacy Policy</Link>.
                </span>
              </label>

              {referralCode && (
                <div className="mt-3 text-xs text-success bg-success/10 border border-success/30 rounded-lg p-2.5">
                  Referral code <span className="font-mono font-bold">{referralCode}</span> applied — you'll get KSh 50 welcome bonus.
                </div>
              )}

              {error && <ErrorBox msg={error} />}
              <button disabled={confirmPin.length !== 4 || loading} onClick={finalizeRegistration}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-semibold shadow-gold disabled:opacity-40 active:scale-[0.98] transition flex items-center justify-center gap-2">
                {loading ? <Loader2 className="size-5 animate-spin" /> : (
                  <><KeyRound className="size-5" /> Create account</>
                )}
              </button>
            </motion.div>
          )}

          {step === "welcome" && profile && (
            <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <motion.div
                initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto size-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
                <CheckCircle2 className="size-9 text-primary-foreground" />
              </motion.div>
              <h2 className="text-2xl font-bold text-center">Karibu {profile.display_name}!</h2>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Complete product reviews and earn instantly.
              </p>
              <div className="mt-4 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Worker ID</p>
                <p className="text-3xl font-bold text-gradient-gold mt-2 font-mono">{profile.worker_id}</p>
              </div>
              <button onClick={() => onComplete(profile)}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-semibold shadow-gold active:scale-[0.98] transition">
                Start earning
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-xs text-muted-foreground/70">Earn while you work — every review pays cash.</p>
    </div>
  );
}

function ShieldIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
      <input
        type="tel" inputMode="numeric" maxLength={4} placeholder="••••"
        value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground tracking-[0.8em] text-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      <span>{msg}</span>
    </div>
  );
}
