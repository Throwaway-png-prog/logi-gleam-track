import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, KeyRound, CheckCircle2, Loader2, Boxes } from "lucide-react";
import { createUser, type User } from "@/lib/db";

type Step = "phone" | "pin" | "done";

export function Registration({ onComplete }: { onComplete: (u: User) => void }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const phoneValid = phone.replace(/\D/g, "").length >= 8;

  async function submitPin() {
    if (pin.length !== 4) return;
    setLoading(true);
    const u = await createUser(phone, pin);
    setUser(u);
    setLoading(false);
    setStep("done");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-center"
      >
        <div className="size-16 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center mb-4">
          <Boxes className="size-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Logi<span className="text-gradient-gold">Back</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Warehouse workflow, simplified.</p>
      </motion.div>

      <div className="w-full max-w-sm glass rounded-3xl p-6 shadow-elegant">
        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Step 1 of 2</label>
              <h2 className="text-xl font-semibold mt-1 mb-5">Your phone number</h2>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="+1 555 0123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                disabled={!phoneValid}
                onClick={() => setStep("pin")}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === "pin" && (
            <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Step 2 of 2</label>
              <h2 className="text-xl font-semibold mt-1 mb-1">Create your 4-digit PIN</h2>
              <p className="text-sm text-muted-foreground mb-5">Used to unlock your shift sessions.</p>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground tracking-[0.8em] text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                disabled={pin.length !== 4 || loading}
                onClick={submitPin}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : "Create account"}
              </button>
            </motion.div>
          )}

          {step === "done" && user && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto size-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow mb-4"
              >
                <CheckCircle2 className="size-9 text-primary-foreground" />
              </motion.div>
              <h2 className="text-xl font-semibold text-center">You're in.</h2>
              <p className="text-sm text-muted-foreground text-center mt-1">Your Worker ID</p>
              <div className="mt-4 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Worker ID</p>
                <p className="text-3xl font-bold text-gradient-gold mt-2 font-mono">{user.id}</p>
              </div>
              <button
                onClick={() => onComplete(user)}
                className="mt-6 w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-semibold shadow-gold active:scale-[0.98] transition"
              >
                Enter dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-xs text-muted-foreground/70">Demo simulation. No real data is transmitted.</p>
    </div>
  );
}
