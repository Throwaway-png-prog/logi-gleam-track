import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, ExternalLink, Star, Upload, CheckCircle2, ShieldCheck, AlertCircle, X,
} from "lucide-react";
import {
  getProduct, getSessionId, loadProfile, submitReview, uploadScreenshot,
  type Product, type Profile,
} from "@/lib/api";
import { formatKsh } from "@/lib/format";

export const Route = createFileRoute("/products/$id")({
  component: ProductReviewPage,
  head: () => ({ meta: [{ title: "Submit review — LogiBack Earn" }] }),
});

function ProductReviewPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { navigate({ to: "/app" }); return; }
    Promise.all([getProduct(id), loadProfile(sid)]).then(([p, u]) => {
      setProduct(p); setUser(u); setLoading(false);
    });
  }, [id, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }
  if (!product || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/products" className="mt-4 text-primary hover:underline">← Back to products</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/products" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Review job</p>
          <h1 className="text-lg font-bold truncate">{product.name}</h1>
        </div>
      </div>

      <ReviewForm product={product} user={user} disabled={!acknowledged} />

      <AnimatePresence>
        {showInstructions && (
          <InstructionsModal
            onAcknowledge={() => { setAcknowledged(true); setShowInstructions(false); }}
            onClose={() => navigate({ to: "/products" })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InstructionsModal({ onAcknowledge, onClose }: { onAcknowledge: () => void; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reachedBottom, setReachedBottom] = useState(false);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) setReachedBottom(true);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="w-full sm:max-w-lg glass rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gold/30">
        <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <ShieldCheck className="size-5 text-gold-foreground" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gold">Required read</p>
              <h2 className="font-bold">Review Guidelines</h2>
            </div>
          </div>
          <button onClick={onClose} className="size-9 rounded-lg glass flex items-center justify-center" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="overflow-y-auto p-5 text-sm space-y-4">
          <p className="text-base font-bold">PRODUCT REVIEW GUIDELINES</p>
          <p>Thank you for joining <span className="text-gradient-gold font-semibold">LogiBack Earn</span>! You are about to earn real money by writing honest product reviews.</p>

          <Section title="How to complete a review">
            <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
              <li><span className="text-foreground">Step 1:</span> Click the product link to open the retailer's site (Jumia/Kilimall/Amazon).</li>
              <li><span className="text-foreground">Step 2:</span> Scroll the product page — photos, full description, Q&amp;A, and existing reviews.</li>
              <li><span className="text-foreground">Step 3:</span> Write a genuine review (min. 30 words) with a 1–5 star rating and at least one screenshot.</li>
              <li><span className="text-foreground">Step 4:</span> Take a screenshot of your published review.</li>
              <li><span className="text-foreground">Step 5:</span> Return here and upload your screenshot.</li>
              <li><span className="text-foreground">Step 6:</span> Hit <span className="text-foreground font-semibold">Submit Review</span> to receive your points.</li>
            </ol>
          </Section>

          <Section title="Quality standards">
            <p className="text-success mb-1">✅ DO</p>
            <ul className="list-disc list-inside text-muted-foreground mb-3">
              <li>Write specific comments about product features</li>
              <li>Compare to similar items you've used</li>
              <li>Mention shipping and packaging experience</li>
              <li>Upload clear screenshots</li>
            </ul>
            <p className="text-destructive mb-1">❌ DON'T</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Copy-paste from other reviews</li>
              <li>Submit reviews without screenshots</li>
              <li>Rate without reading the description</li>
              <li>Submit spam or fake content</li>
            </ul>
          </Section>

          <Section title="Important notes">
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>All reviews are quality-checked by our team.</li>
              <li>Low-quality or fake reviews will be rejected.</li>
              <li>Approved reviews credit points instantly.</li>
              <li>1 point = KSh 1. Withdraw to M-Pesa from 1,000 points.</li>
            </ul>
          </Section>

          <Section title="Example review">
            <div className="glass rounded-xl p-3 text-xs space-y-1">
              <p><span className="font-semibold">Product:</span> CoolTech Wireless Headphones</p>
              <p className="flex items-center gap-1"><span className="font-semibold">Rating:</span> {Array.from({ length: 4 }).map((_, i) => <Star key={i} className="size-3 fill-gold text-gold" />)} <span className="text-muted-foreground">(4/5)</span></p>
              <p className="italic text-muted-foreground">
                "I tested these CoolTech headphones for a week. The bass is impressive for the price (KSh 3,500). Battery lasts about 8 hours of continuous use. Bluetooth connects fast. Only downside is the ear cushions feel a bit stiff. Overall good value for money."
              </p>
              <p className="text-[10px] text-muted-foreground">[Screenshot attached]</p>
            </div>
          </Section>

          <p className="text-xs text-muted-foreground pt-2">
            By clicking <span className="text-foreground font-semibold">"I UNDERSTAND"</span> below, you confirm that you will follow these guidelines and submit genuine, high-quality reviews.
          </p>
        </div>

        <div className="p-5 border-t border-border/50 shrink-0 bg-background/40">
          {!reachedBottom && (
            <p className="text-xs text-center text-muted-foreground mb-2 flex items-center justify-center gap-1.5">
              <AlertCircle className="size-3.5" /> Scroll to the bottom to continue
            </p>
          )}
          <button
            onClick={onAcknowledge}
            disabled={!reachedBottom}
            className="w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-gold disabled:opacity-40 active:scale-[0.98] transition"
          >
            I UNDERSTAND
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-2">{title}</p>
      {children}
    </div>
  );
}

function ReviewForm({ product, user, disabled }: { product: Product; user: Profile; disabled: boolean }) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const navigate = useNavigate();
  const charsOk = text.trim().length >= 30;
  const canSubmit = !disabled && charsOk && rating > 0 && file && !submitting;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const url = file ? await uploadScreenshot(user.id, file) : null;
      await submitReview({
        user_id: user.id, product, review_text: text.trim(), rating, screenshot_url: url,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit review");
    } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-3xl p-8 text-center shadow-elegant">
        <div className="size-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
          <CheckCircle2 className="size-9 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold">Review submitted!</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Pending quality check by our team. Points will be credited within <span className="text-foreground font-semibold">2 hours</span>.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link to="/products" className="h-12 rounded-xl glass flex items-center justify-center text-sm font-semibold">More jobs</Link>
          <Link to="/" className="h-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-glow">Dashboard</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-4 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      {/* Product card */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="aspect-video bg-muted overflow-hidden">
          <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.platform} · {product.category}</p>
            <p className="text-xs font-bold text-gradient-gold">+{product.points_reward} pts</p>
          </div>
          <p className="font-bold text-base mt-1">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.brand} · {formatKsh(product.price_ksh)} · {product.est_minutes}</p>
        </div>
      </div>

      {/* Platform link */}
      <a
        href={`https://www.google.com/search?q=${encodeURIComponent(`${product.brand} ${product.name} ${product.platform}`)}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between glass rounded-2xl p-4 border border-primary/30 active:scale-[0.99] transition"
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">Step 1</p>
          <p className="text-sm font-semibold">Go to {product.platform} to review</p>
        </div>
        <ExternalLink className="size-5 text-primary" />
      </a>

      {/* Review text */}
      <div className="glass rounded-2xl p-4">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Step 2 · Your review</label>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Share your honest opinion — features, comparisons, shipping, packaging…"
          rows={5}
          className="mt-2 w-full p-3 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
        />
        <div className="flex items-center justify-between mt-1.5 text-xs">
          <span className={charsOk ? "text-success" : "text-muted-foreground"}>{text.trim().length}/30 minimum</span>
        </div>
      </div>

      {/* Stars */}
      <div className="glass rounded-2xl p-4">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Step 3 · Star rating</label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}
              className="size-12 rounded-xl glass flex items-center justify-center active:scale-90 transition">
              <Star className={`size-7 ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div className="glass rounded-2xl p-4">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Step 4 · Screenshot of published review</label>
        <label className="mt-2 block cursor-pointer">
          <input type="file" accept="image/*" onChange={onPick} className="hidden" />
          {preview ? (
            <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-xl bg-background" />
          ) : (
            <div className="h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-sm text-muted-foreground">
              <Upload className="size-6 mb-1" />
              Tap to upload screenshot
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      <button onClick={submit} disabled={!canSubmit}
        className="w-full h-14 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="size-5 animate-spin" /> : "Submit Review"}
      </button>
    </div>
  );
}
