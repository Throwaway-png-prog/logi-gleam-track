import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck, Loader2, Users, Inbox, Power, Check, X, ArrowLeft, AlertCircle, Wallet, PauseCircle, Star, MessageSquare,
} from "lucide-react";
import {
  listProfiles, listPendingUpgrades, approveUpgrade, rejectUpgrade,
  listPendingRedemptions, approveRedemption, rejectRedemption,
  listPendingReviews, approveReview, rejectReview,
  getSystemSettings, setMaintenance, setRedemptionsOnHold,
  type Profile, type UpgradeRequest, type RedemptionRequest, type ReviewSubmission, type Product,
} from "@/lib/api";
import { formatKsh } from "@/lib/format";

const SUPERVISOR_PIN = "123456";

export const Route = createFileRoute("/supervisor")({
  component: SupervisorPage,
  head: () => ({ meta: [{ title: "Supervisor — LogiBack Earn" }] }),
});

function SupervisorPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (pin === SUPERVISOR_PIN) { setAuthed(true); setError(null); }
    else setError("Incorrect supervisor PIN");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <Link to="/" className="absolute top-6 left-6 size-11 rounded-xl glass flex items-center justify-center">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="size-16 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold mb-4">
          <ShieldCheck className="size-8 text-gold-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Supervisor portal</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Enter your 6-digit access PIN</p>
        <div className="w-full max-w-sm glass rounded-2xl p-5">
          <input type="tel" inputMode="numeric" maxLength={6} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            className="w-full h-14 px-4 rounded-xl bg-input border border-border tracking-[0.5em] text-lg text-center focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <div className="mt-3 flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</div>}
          <button onClick={submit} disabled={pin.length !== 6}
            className="mt-4 w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-40 active:scale-[0.98] transition">
            Unlock
          </button>
        </div>
      </div>
    );
  }
  return <SupervisorDashboard />;
}

function SupervisorDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pending, setPending] = useState<(UpgradeRequest & { profile?: Profile })[]>([]);
  const [reviews, setReviews] = useState<(ReviewSubmission & { product?: Product; profile?: Profile })[]>([]);
  const [maint, setMaint] = useState(false);
  const [redOnHold, setRedOnHold] = useState(false);
  const [redemptions, setRedemptions] = useState<(RedemptionRequest & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<ReviewSubmission | null>(null);

  async function refresh() {
    const [pp, up, settings, rd, rv] = await Promise.all([
      listProfiles(), listPendingUpgrades(), getSystemSettings(), listPendingRedemptions(), listPendingReviews(),
    ]);
    setProfiles(pp); setPending(up);
    setMaint(settings.maintenance); setRedOnHold(settings.redemptions_on_hold);
    setRedemptions(rd); setReviews(rv);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function toggleMaint() { const n = !maint; setMaint(n); await setMaintenance(n); }
  async function toggleRedemptions() { const n = !redOnHold; setRedOnHold(n); await setRedemptionsOnHold(n); }

  async function doApprove(r: UpgradeRequest) { setBusy(r.id); await approveUpgrade(r); setBusy(null); refresh(); }
  async function doReject(r: UpgradeRequest) { setBusy(r.id); await rejectUpgrade(r); setBusy(null); refresh(); }
  async function approveRed(r: RedemptionRequest) { setBusy(r.id); await approveRedemption(r); setBusy(null); refresh(); }
  async function rejectRed(r: RedemptionRequest) { setBusy(r.id); await rejectRedemption(r); setBusy(null); refresh(); }
  async function approveRev(r: ReviewSubmission) { setBusy(r.id); await approveReview(r); setBusy(null); refresh(); }
  async function rejectRev(r: ReviewSubmission, reason: string) {
    setBusy(r.id); await rejectReview(r, reason); setBusy(null); setRejecting(null); refresh();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;

  const totalReviewsToday = reviews.length;
  const totalApproved = profiles.reduce((a, p) => a + (p.reviews_approved ?? 0), 0);
  const totalRejected = profiles.reduce((a, p) => a + (p.reviews_rejected ?? 0), 0);
  const approvalRate = totalApproved + totalRejected > 0
    ? Math.round((totalApproved / (totalApproved + totalRejected)) * 100) : 100;

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Portal</p>
            <h1 className="text-xl font-bold text-gradient-gold">Supervisor</h1>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Mini label="Pending" value={totalReviewsToday.toString()} />
        <Mini label="Approval rate" value={`${approvalRate}%`} />
        <Mini label="Workers" value={profiles.length.toString()} />
      </div>

      {/* Toggles */}
      <motion.button whileTap={{ scale: 0.99 }} onClick={toggleMaint}
        className={`w-full glass rounded-2xl p-4 mb-3 flex items-center justify-between border ${
          maint ? "border-destructive/50 bg-destructive/10" : "border-primary/40 bg-primary/5"
        }`}>
        <div className="flex items-center gap-3">
          <Power className={`size-5 ${maint ? "text-destructive" : "text-primary"}`} />
          <div className="text-left">
            <p className="font-semibold">{maint ? "Maintenance mode" : "System active"}</p>
            <p className="text-xs text-muted-foreground">
              {maint ? "Workers cannot submit reviews." : "Workers can submit reviews."}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${maint ? "text-destructive" : "text-primary"}`}>{maint ? "OFF" : "ON"}</span>
      </motion.button>

      <motion.button whileTap={{ scale: 0.99 }} onClick={toggleRedemptions}
        className={`w-full glass rounded-2xl p-4 mb-5 flex items-center justify-between border ${
          redOnHold ? "border-destructive/50 bg-destructive/10" : "border-gold/40 bg-gold/5"
        }`}>
        <div className="flex items-center gap-3">
          <PauseCircle className={`size-5 ${redOnHold ? "text-destructive" : "text-gold"}`} />
          <div className="text-left">
            <p className="font-semibold">Redemptions: {redOnHold ? "On Hold" : "Active"}</p>
            <p className="text-xs text-muted-foreground">{redOnHold ? "Workers cannot withdraw." : "Workers can withdraw."}</p>
          </div>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${redOnHold ? "text-destructive" : "text-gold"}`}>{redOnHold ? "PAUSED" : "LIVE"}</span>
      </motion.button>

      {/* Review queue */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="size-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Reviews pending ({reviews.length})</h2>
        </div>
        {reviews.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No pending reviews.</div>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="glass rounded-2xl p-4">
                <div className="flex gap-3">
                  {r.product?.image_url && (
                    <img src={r.product.image_url} loading="lazy" alt="" className="size-16 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">@{r.profile?.display_name ?? r.profile?.worker_id}</p>
                    <p className="font-semibold text-sm line-clamp-1">{r.product?.name ?? "Unknown"}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-3 fill-gold text-gold" />)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.review_text}</p>
                    {r.screenshot_url && (
                      <a href={r.screenshot_url} target="_blank" rel="noopener noreferrer"
                         className="inline-block mt-2 text-[10px] text-primary hover:underline">View screenshot →</a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setRejecting(r)} disabled={busy === r.id}
                    className="flex-1 h-10 rounded-lg bg-destructive/15 text-destructive text-sm font-semibold active:scale-95 disabled:opacity-50">
                    Reject
                  </button>
                  <button onClick={() => approveRev(r)} disabled={busy === r.id}
                    className="flex-1 h-10 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold active:scale-95 disabled:opacity-50">
                    {busy === r.id ? <Loader2 className="size-4 animate-spin mx-auto" /> : `Approve · +${r.points_reward}`}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Redemptions */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="size-4 text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Redemption queue ({redemptions.length})</h2>
        </div>
        {redemptions.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No pending redemptions.</div>
        ) : (
          <ul className="space-y-3">
            {redemptions.map((r) => (
              <li key={r.id} className="glass rounded-2xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold font-mono">{r.profile?.worker_id ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{r.profile?.phone}</p>
                  <p className="text-sm mt-2">
                    <span className="text-gradient-primary font-semibold">{r.points_redeemed.toLocaleString()} pts</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="text-gradient-gold font-semibold">{formatKsh(r.ksh_value)}</span>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => rejectRed(r)} disabled={busy === r.id} className="size-11 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center disabled:opacity-50"><X className="size-5" /></button>
                  <button onClick={() => approveRed(r)} disabled={busy === r.id} className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">{busy === r.id ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upgrades */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="size-4 text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Pending upgrades ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No pending requests.</div>
        ) : (
          <ul className="space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="glass rounded-2xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.profile?.worker_id ?? "Unknown"} → <span className="text-gradient-gold">{r.requested_tier}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.profile?.phone}</p>
                  <p className="text-xs mt-2">{formatKsh(r.amount_paid)} · <span className="font-mono">{r.transaction_code}</span></p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => doReject(r)} disabled={busy === r.id} className="size-11 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center disabled:opacity-50"><X className="size-5" /></button>
                  <button onClick={() => doApprove(r)} disabled={busy === r.id} className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">{busy === r.id ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Workers */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Workers ({profiles.length})</h2>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="text-left p-3">Worker</th>
                <th className="text-left p-3">Tier</th>
                <th className="text-right p-3">Pts</th>
                <th className="text-right p-3">✓/✗</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-border/40 last:border-0">
                  <td className="p-3">
                    <p className="font-semibold">@{p.display_name || p.worker_id}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.worker_id}</p>
                  </td>
                  <td className="p-3">{p.tier}</td>
                  <td className="p-3 text-right text-gold font-semibold">{p.points.toLocaleString()}</td>
                  <td className="p-3 text-right text-xs">{p.reviews_approved ?? 0} / {p.reviews_rejected ?? 0}</td>
                </tr>
              ))}
              {profiles.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No workers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {rejecting && (
        <RejectModal review={rejecting} onClose={() => setRejecting(null)} onConfirm={(reason) => rejectRev(rejecting, reason)} />
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function RejectModal({ review, onClose, onConfirm }: { review: ReviewSubmission; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }}
        className="w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl p-5 border border-destructive/30">
        <p className="text-xs uppercase tracking-wider text-destructive font-semibold">Reject review</p>
        <p className="text-sm mt-1">Tell <span className="font-semibold">@{(review as any).profile?.display_name ?? "this user"}</span> why their review was rejected.</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
          placeholder="e.g. Less than 30 words, no clear screenshot, looks copy-pasted…"
          className="mt-3 w-full p-3 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl glass text-sm font-semibold">Cancel</button>
          <button onClick={() => onConfirm(reason.trim() || "Did not meet review guidelines.")}
            className="flex-1 h-12 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold">
            Reject
          </button>
        </div>
      </motion.div>
    </div>
  );
}
