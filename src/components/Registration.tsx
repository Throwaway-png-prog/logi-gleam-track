import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, KeyRound, CheckCircle2, Loader2, Boxes, AlertCircle, User, AtSign } from "lucide-react";
import { findByPhone, registerProfile, loginProfile, setSessionId, getPendingReferral, setPendingReferral, findProfileByReferralCode, type Profile } from "@/lib/api";
import { formatPhoneKE } from "@/lib/format";

type Step = "phone" | "name" | "display" | "pin" | "confirm" | "welcome";

export function Registration({ onComplete }: { onComplete: (u: Profile) => void }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [termsOk, setTermsOk] = useState(false);
  const [referralCode] = useState<string | null>(() => getPendingReferral());

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 9 && phoneDigits.length <= 12;

  async function continuePhone() {
    setLoading(true); setError(null);
    try {
      const existing = await findByPhone(phone);
      setMode(existing ? "login" : "register");
      setStep(existing ? "pin" : "name");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally { setLoading(false); }
  }

  async function submitPin() {
    if (pin.length !== 4) return;
    setLoading(true); setError(null);
    try {
      if (mode === "login") {
        const u = await loginProfile(phone, pin);
        if (!u) { setError("Incorrect PIN"); setLoading(false); return; }
        setSessionId(u.id);
        onComplete(u);
        return;
      }
      // register flow needs confirm
      setStep("confirm"); setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in");
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
        referred_by: referrerId,
        terms_accepted: true,
      });
      setPendingReferral(null);
      setProfile(u); setSessionId(u.id); setStep("welcome");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col items-center">
        <div className="size-16 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center mb-4">
          <Boxes className="size-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Logi<span className="text-gradient-gold">Back Earn</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Get paid to review products.</p>
      </motion.div>

      <div className="w-full max-w-sm glass rounded-3xl p-6 shadow-elegant">
        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Sign in or register</label>
              <h2 className="text-xl font-semibold mt-1 mb-5">Your phone number</h2>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  type="tel" inputMode="tel" placeholder="0712 345 678"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {phone && <p className="mt-2 text-xs text-muted-foreground">Saved as <span className="font-mono text-foreground">{formatPhoneKE(phone)}</span></p>}
              {error && <ErrorBox msg={error} />}
              <button disabled={!phoneValid || loading} onClick={continuePhone}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition flex items-center justify-center gap-2">
                {loading ? <Loader2 className="size-5 animate-spin" /> : "Continue"}
              </button>
            </motion.div>
          )}

          {step === "name" && (
            <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
            <motion.div key="display" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
              <button disabled={displayName.trim().length < 3} onClick={() => setStep("pin")}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 active:scale-[0.98] transition">
                Continue
              </button>
            </motion.div>
          )}

          {step === "pin" && (
            <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
              {error && <ErrorBox msg={error} />}
              <button disabled={pin.length !== 4 || loading} onClick={submitPin}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 active:scale-[0.98] transition flex items-center justify-center gap-2">
                {loading ? <Loader2 className="size-5 animate-spin" /> : mode === "login" ? "Sign in" : "Continue"}
              </button>
              <button onClick={() => { setStep("phone"); setPin(""); setError(null); }}
                className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground">
                Use a different number
              </button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
                  I agree to the <Link to="/terms" target="_blank" className="text-gold underline">Terms & Conditions</Link> and{" "}
                  <Link to="/privacy" target="_blank" className="text-gold underline">Privacy Policy</Link>.
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
            <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
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
                Enter dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-xs text-muted-foreground/70">Earn while you work — every review pays cash.</p>
    </div>
  );
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
