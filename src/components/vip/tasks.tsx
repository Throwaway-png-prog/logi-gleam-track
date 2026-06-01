// Simulated VIP task UIs. None of these submit real data — they are skill-floor
// proof-of-engagement so users don't claim payouts in a single tap above VIP 0.
import { useState } from "react";
import { Star, Check, ChevronRight, ChevronLeft } from "lucide-react";

interface TaskProps {
  onComplete: (payload: unknown) => void;
  busy: boolean;
}

export function TaskRating({ onComplete, busy }: TaskProps) {
  const [rating, setRating] = useState(0);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Rate this sample product to claim your KSh 300 bonus.</p>
      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <div className="size-14 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">N</div>
        <div>
          <p className="font-semibold text-sm">Nivea Body Lotion 400ml</p>
          <p className="text-xs text-muted-foreground">Personal care · Jumia KE</p>
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}
            className="size-12 active:scale-90 transition">
            <Star className={`size-12 ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <button disabled={rating === 0 || busy} onClick={() => onComplete({ rating })}
        className="w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-50">
        {busy ? "Submitting…" : "Submit rating"}
      </button>
    </div>
  );
}

export function TaskText({ onComplete, busy }: TaskProps) {
  const [txt, setTxt] = useState("");
  const words = txt.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Write a short review (minimum 3 words).</p>
      <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={4}
        placeholder="e.g. Fast delivery, well packaged."
        className="w-full p-3 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      <p className="text-xs text-muted-foreground">{words} word{words === 1 ? "" : "s"}</p>
      <button disabled={words < 3 || busy} onClick={() => onComplete({ review: txt.trim() })}
        className="w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-50">
        {busy ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}

export function TaskMultistep({ onComplete, busy }: TaskProps) {
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const orders = ["ORD-4821 · KSh 2,400", "ORD-4827 · KSh 5,990", "ORD-4839 · KSh 1,200"];
  return (
    <div className="space-y-3">
      <Steps current={step} total={3} />
      {step === 0 && (
        <>
          <p className="text-sm text-muted-foreground">Step 1: pick an order to verify.</p>
          {orders.map((o) => (
            <button key={o} onClick={() => { setOrder(o); setStep(1); }}
              className={`w-full text-left p-3 rounded-xl glass border ${order === o ? "border-primary" : "border-border/40"}`}>{o}</button>
          ))}
        </>
      )}
      {step === 1 && (
        <>
          <p className="text-sm text-muted-foreground">Step 2: confirm details for <span className="font-mono text-foreground">{order}</span>.</p>
          <label className="flex items-center gap-2 p-3 rounded-xl glass">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="size-4" />
            <span className="text-sm">Address and items match the manifest</span>
          </label>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 h-11 rounded-xl glass"><ChevronLeft className="inline size-4" /> Back</button>
            <button disabled={!verified} onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">Next <ChevronRight className="inline size-4" /></button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <p className="text-sm text-muted-foreground">Step 3: confirm to claim your KSh 1,500.</p>
          <button disabled={busy} onClick={() => onComplete({ order, verified })}
            className="w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-50">
            {busy ? "Submitting…" : "Confirm & claim"}
          </button>
        </>
      )}
    </div>
  );
}

export function TaskForm({ onComplete, busy }: TaskProps) {
  const [product, setProduct] = useState("");
  const [qty, setQty] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [fragile, setFragile] = useState(false);
  const valid = product && qty && method;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Optimize a shipping record. All fields required.</p>
      <select value={product} onChange={(e) => setProduct(e.target.value)} className="w-full h-12 px-3 rounded-xl bg-input border border-border">
        <option value="">Product…</option><option>Phone case</option><option>Headphones</option><option>Charger</option>
      </select>
      <input type="number" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full h-12 px-3 rounded-xl bg-input border border-border" />
      <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-12 px-3 rounded-xl bg-input border border-border">
        <option value="">Shipping method…</option><option>Standard</option><option>Express</option><option>Pickup</option>
      </select>
      <label className="flex items-center gap-2 p-3 rounded-xl glass">
        <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} className="size-4" />
        <span className="text-sm">Mark as fragile</span>
      </label>
      <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        className="w-full p-3 rounded-xl bg-input border border-border resize-none" />
      <button disabled={!valid || busy} onClick={() => onComplete({ product, qty, method, notes, fragile })}
        className="w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-50">
        {busy ? "Submitting…" : "Submit shipping data"}
      </button>
    </div>
  );
}

export function TaskWorkflow({ onComplete, busy }: TaskProps) {
  const [step, setStep] = useState(0);
  const [region, setRegion] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [driver, setDriver] = useState("");
  const screens = [
    { title: "Select region", options: ["Nairobi", "Mombasa", "Kisumu"], value: region, set: setRegion },
    { title: "Choose warehouse", options: ["WH-01 Industrial", "WH-02 Karen", "WH-03 Mlolongo"], value: warehouse, set: setWarehouse },
    { title: "Assign driver", options: ["Driver A · 4.9⭐", "Driver B · 4.7⭐", "Driver C · 4.8⭐"], value: driver, set: setDriver },
  ] as const;
  return (
    <div className="space-y-3">
      <Steps current={step} total={4} />
      {step < 3 ? (
        <>
          <p className="text-sm font-semibold">{screens[step].title}</p>
          {screens[step].options.map((o) => (
            <button key={o} onClick={() => { screens[step].set(o); setStep(step + 1); }}
              className={`w-full text-left p-3 rounded-xl glass border ${screens[step].value === o ? "border-primary" : "border-border/40"}`}>{o}</button>
          ))}
        </>
      ) : (
        <>
          <p className="text-sm font-semibold">Confirm manifest</p>
          <div className="glass rounded-xl p-4 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Region:</span> {region}</p>
            <p><span className="text-muted-foreground">Warehouse:</span> {warehouse}</p>
            <p><span className="text-muted-foreground">Driver:</span> {driver}</p>
          </div>
          <button disabled={busy} onClick={() => onComplete({ region, warehouse, driver })}
            className="w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-50">
            {busy ? "Submitting…" : "Confirm & claim KSh 20,000"}
          </button>
        </>
      )}
      {step > 0 && step < 3 && (
        <button onClick={() => setStep(step - 1)} className="w-full h-10 rounded-xl glass text-sm">← Back</button>
      )}
    </div>
  );
}

export function TaskReviewQueue({ onComplete, busy }: TaskProps) {
  const items = [
    { id: 1, title: "AI translation: 'Karibu nyumbani'", suggested: "Welcome home" },
    { id: 2, title: "Image label: street market scene", suggested: "Outdoor marketplace, Nairobi" },
    { id: 3, title: "Sentiment: 'Service was very slow'", suggested: "Negative" },
  ];
  const [decisions, setDecisions] = useState<Record<number, "approve" | "reject" | null>>({ 1: null, 2: null, 3: null });
  const allDecided = items.every((i) => decisions[i.id]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Approve or reject each mock AI output.</p>
      {items.map((i) => (
        <div key={i.id} className="glass rounded-xl p-3 space-y-2">
          <p className="text-sm font-semibold">{i.title}</p>
          <p className="text-xs text-muted-foreground">AI suggested: <span className="text-foreground">{i.suggested}</span></p>
          <div className="flex gap-2">
            <button onClick={() => setDecisions((d) => ({ ...d, [i.id]: "approve" }))}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold ${decisions[i.id] === "approve" ? "bg-primary text-primary-foreground" : "glass"}`}>Approve</button>
            <button onClick={() => setDecisions((d) => ({ ...d, [i.id]: "reject" }))}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold ${decisions[i.id] === "reject" ? "bg-destructive text-destructive-foreground" : "glass"}`}>Reject</button>
          </div>
        </div>
      ))}
      <button disabled={!allDecided || busy} onClick={() => onComplete({ decisions })}
        className="w-full h-12 rounded-xl bg-gradient-gold text-gold-foreground font-semibold disabled:opacity-50">
        {busy ? "Submitting…" : "Submit review batch"}
      </button>
    </div>
  );
}

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= current ? "bg-gradient-gold" : "bg-border/40"}`} />
      ))}
    </div>
  );
}

export function renderTask(kind: string, props: TaskProps) {
  switch (kind) {
    case "rating": return <TaskRating {...props} />;
    case "text": return <TaskText {...props} />;
    case "multistep": return <TaskMultistep {...props} />;
    case "form": return <TaskForm {...props} />;
    case "workflow": return <TaskWorkflow {...props} />;
    case "review_queue": return <TaskReviewQueue {...props} />;
    default: return <p className="text-sm text-muted-foreground">Unknown task type.</p>;
  }
}

export function CheckIcon() { return <Check className="size-5" />; }
