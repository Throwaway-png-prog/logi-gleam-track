import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, CheckCircle2 } from "lucide-react";

const ACK_KEY = "logiback.guidelines_ack_v1";
export function hasAckedGuidelines() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ACK_KEY) === "1";
}
export function ackGuidelines() {
  if (typeof window !== "undefined") localStorage.setItem(ACK_KEY, "1");
}

export function ReviewGuidelinesModal({ open, onClose, onAccept }: {
  open: boolean; onClose: () => void; onAccept?: () => void;
}) {
  const [canAccept, setCanAccept] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setCanAccept(false); return; }
    const t = setTimeout(() => {
      if (!sentinelRef.current || !scrollRef.current) return;
      const obs = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) setCanAccept(true); },
        { root: scrollRef.current, threshold: 0.9 },
      );
      obs.observe(sentinelRef.current);
      return () => obs.disconnect();
    }, 100);
    return () => clearTimeout(t);
  }, [open]);

  function accept() {
    ackGuidelines();
    onAccept?.();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[92vh] glass rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col border border-gold/40">
            <div className="flex items-center justify-between p-4 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-gold" />
                <h2 className="font-bold">Review Guidelines</h2>
              </div>
              <button onClick={onClose} className="size-9 rounded-lg glass flex items-center justify-center">
                <X className="size-4" />
              </button>
            </div>

            <div ref={scrollRef} className="overflow-y-auto p-5 text-sm leading-relaxed space-y-5">
              <p className="text-xs text-muted-foreground">📋 Please scroll through the entire policy. The "I UNDERSTAND" button activates once you reach the end.</p>

              <Section title="✅ Requirements for earnings" tone="success">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Find the product on Jumia, Kilimall, or Amazon (search manually using your browser or the app).</li>
                  <li>Write a minimum of <strong>30 words</strong> about your genuine experience.</li>
                  <li>Include specific details: quality, price, shipping, packaging.</li>
                  <li>Rate 1–5 stars based on your honest opinion.</li>
                  <li>Take a screenshot showing the product page (proof it exists).</li>
                  <li>Upload the screenshot here when submitting your review.</li>
                </ol>
              </Section>

              <Section title="❌ What voids earnings" tone="destructive">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Copy-pasting from other reviews</li>
                  <li>Submitting without a screenshot</li>
                  <li>Reviewing the same product twice</li>
                  <li>Fake or AI-generated reviews</li>
                  <li>Reviews under 30 words</li>
                </ul>
              </Section>

              <Section title="⚠️ Consequences of violation" tone="gold">
                <ul className="space-y-1.5">
                  <li><strong>First warning:</strong> Review rejected, no points awarded.</li>
                  <li><strong>Second warning:</strong> 24-hour suspension.</li>
                  <li><strong>Third warning:</strong> Permanent ban + forfeited earnings.</li>
                </ul>
              </Section>

              <Section title="🔒 Your safety" tone="primary">
                <ul className="space-y-1.5">
                  <li>Never share your PIN with anyone.</li>
                  <li>LogiBack will never ask for your M-Pesa password.</li>
                  <li>Report suspicious activity to <a href="mailto:support@logiback.co.ke" className="text-gold underline">support@logiback.co.ke</a>.</li>
                </ul>
              </Section>

              <div ref={sentinelRef} className="text-center text-xs text-muted-foreground py-3 border-t border-border/30">
                You've reached the end. Click <strong className="text-gold">I UNDERSTAND</strong> to proceed.
              </div>
            </div>

            <div className="p-4 border-t border-border/40 shrink-0">
              <button
                onClick={accept} disabled={!canAccept}
                className="w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-gold disabled:opacity-40 active:scale-[0.98] transition flex items-center justify-center gap-2">
                <CheckCircle2 className="size-5" /> {canAccept ? "I UNDERSTAND" : "Scroll to the bottom to continue"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, tone, children }: { title: string; tone: "success" | "destructive" | "gold" | "primary"; children: React.ReactNode }) {
  const border =
    tone === "success" ? "border-success/40 bg-success/5"
    : tone === "destructive" ? "border-destructive/40 bg-destructive/5"
    : tone === "gold" ? "border-gold/40 bg-gold/5"
    : "border-primary/40 bg-primary/5";
  return (
    <div className={`rounded-2xl border p-4 ${border}`}>
      <p className="font-bold text-sm mb-2">{title}</p>
      <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
