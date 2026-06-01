import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Crown, Copy, Check } from "lucide-react";
import { getRotatingPaymentForUpgrade, submitVipUpgrade, type VipJob } from "@/lib/vip";
import { formatKsh } from "@/lib/format";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentVip: number;
  targetJob: VipJob;
  onSubmitted: () => void;
}

export function VipUpgradeModal({ open, onClose, userId, currentVip, targetJob, onSubmitted }: Props) {
  const [number, setNumber] = useState<{ id: string; msisdn: string; label: string } | null>(null);
  const [txCode, setTxCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTxCode(""); setError(null); setNumber(null);
    getRotatingPaymentForUpgrade().then((n) => setNumber(n as any));
  }, [open]);

  async function submit() {
    if (txCode.trim().length < 6) { setError("Enter the full M-Pesa transaction code."); return; }
    setBusy(true); setError(null);
    try {
      await submitVipUpgrade({
        userId,
        fromVip: currentVip,
        toVip: targetJob.vip_level,
        amountKsh: Number(targetJob.upgrade_fee_ksh ?? 0),
        txCode: txCode.trim().toUpperCase(),
        paymentNumberId: number?.id ?? null,
      });
      onSubmitted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally { setBusy(false); }
  }

  function copy() {
    if (!number) return;
    navigator.clipboard?.writeText(number.msisdn);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}>
          <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl border border-gold/40 shadow-elegant overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-gold" />
                <h3 className="font-bold">Upgrade to VIP {targetJob.vip_level}</h3>
              </div>
              <button onClick={onClose} className="size-9 rounded-lg glass flex items-center justify-center"><X className="size-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-gold/20 to-primary/10 p-4 border border-gold/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Pay this amount</p>
                <p className="text-3xl font-bold text-gradient-gold mt-1">{formatKsh(Number(targetJob.upgrade_fee_ksh ?? 0))}</p>
                <p className="text-xs text-muted-foreground mt-1">via M-Pesa Send Money</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Send to (rotates per request)</p>
                {number ? (
                  <button onClick={copy} className="w-full glass rounded-xl p-4 flex items-center justify-between active:scale-[0.99]">
                    <div className="text-left">
                      <p className="font-mono text-lg font-bold">{number.msisdn}</p>
                      <p className="text-xs text-muted-foreground">{number.label}</p>
                    </div>
                    {copied ? <Check className="size-5 text-primary" /> : <Copy className="size-5 text-muted-foreground" />}
                  </button>
                ) : (
                  <div className="h-16 rounded-xl glass animate-pulse" />
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">M-Pesa confirmation code</label>
                <input
                  value={txCode}
                  onChange={(e) => setTxCode(e.target.value.toUpperCase())}
                  placeholder="e.g. QJ7HX2KL9P"
                  className="mt-1 w-full h-12 px-3 rounded-xl bg-input border border-border font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button onClick={submit} disabled={busy || !number}
                className="w-full h-13 py-3 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-gold disabled:opacity-50 flex items-center justify-center gap-2">
                {busy ? <Loader2 className="size-5 animate-spin" /> : "Submit for review"}
              </button>
              <p className="text-[11px] text-center text-muted-foreground">
                Welcome bonus of <span className="text-gold font-semibold">{formatKsh(Number(targetJob.welcome_bonus_ksh ?? 0))}</span> credited on approval.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
