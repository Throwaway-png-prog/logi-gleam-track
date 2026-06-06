import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Loader2, ExternalLink, Star, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { submitReview, uploadScreenshot, bumpStreak, type Product, type Profile } from "@/lib/api";
import { formatKsh } from "@/lib/format";

// Job difficulty scales with the user's VIP tier:
// VIP 0–1: rating + 10 words            (screenshot optional)
// VIP 2–3: rating + 30 words + 1 shot
// VIP 4–5: rating + 50 words + 2 shots + 3 Q/A
function requirementsFor(vip: number) {
  if (vip >= 4) return { minWords: 50, shots: 2, questions: 3 };
  if (vip >= 2) return { minWords: 30, shots: 1, questions: 0 };
  return { minWords: 10, shots: 0, questions: 0 };
}

const QUESTIONS = [
  "What stood out most about the product?",
  "Would you recommend it to a friend? Why?",
  "What could the brand improve next?",
];

export function ReviewForm({ product, user, onDone }: { product: Product; user: Profile; onDone?: () => void }) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const req = requirementsFor((user as any).vip_level ?? 0);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const wordsOk = wordCount >= req.minWords;
  const shotsOk = files.length >= req.shots;
  const questionsOk = req.questions === 0 || answers.slice(0, req.questions).every((a) => a.trim().length >= 5);
  const canSubmit = wordsOk && rating > 0 && shotsOk && questionsOk && !submitting;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    setFiles((cur) => [...cur, ...list].slice(0, Math.max(req.shots, 2)));
    setPreviews((cur) => [...cur, ...list.map((f) => URL.createObjectURL(f))].slice(0, Math.max(req.shots, 2)));
  }

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadScreenshot(user.id, f));
      const composed = req.questions > 0
        ? text.trim() + "\n\n---\n" + answers.slice(0, req.questions).map((a, i) => `Q: ${QUESTIONS[i]}\nA: ${a.trim()}`).join("\n\n")
        : text.trim();
      await submitReview({ user_id: user.id, product, review_text: composed, rating, screenshot_url: urls[0] ?? null });
      await bumpStreak(user.id).catch(() => {});
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
          Pending quality check. Points credit within <span className="text-foreground font-semibold">2 hours</span>.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => onDone?.()} className="h-12 rounded-xl glass flex items-center justify-center text-sm font-semibold">More jobs</button>
          <Link to="/app" className="h-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-glow">Dashboard</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
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

      <a href={`https://www.google.com/search?q=${encodeURIComponent(`${product.brand} ${product.name} ${product.platform}`)}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between glass rounded-2xl p-4 border border-primary/30 active:scale-[0.99] transition">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">Step 1</p>
          <p className="text-sm font-semibold">Go to {product.platform} to review</p>
        </div>
        <ExternalLink className="size-5 text-primary" />
      </a>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Step 2 · Your review</label>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold font-bold uppercase tracking-wider">
            VIP {(user as any).vip_level ?? 0} · {req.minWords}+ words
          </span>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Share your honest opinion — features, comparisons, shipping, packaging…"
          rows={5}
          className="mt-2 w-full p-3 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm" />
        <div className="flex items-center justify-between mt-1.5 text-xs">
          <span className={wordsOk ? "text-success" : "text-muted-foreground"}>{wordCount}/{req.minWords} words</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Step 3 · Star rating</label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className="size-12 rounded-xl glass flex items-center justify-center active:scale-90 transition">
              <Star className={`size-7 ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      </div>

      {req.shots > 0 && (
        <div className="glass rounded-2xl p-4">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Step 4 · Upload {req.shots} screenshot{req.shots > 1 ? "s" : ""} ({files.length}/{req.shots})
          </label>
          <label className="mt-2 block cursor-pointer">
            <input type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
            {previews.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {previews.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-full h-32 object-cover rounded-xl bg-background" />
                ))}
              </div>
            ) : (
              <div className="h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-sm text-muted-foreground">
                <Upload className="size-6 mb-1" /> Tap to upload
              </div>
            )}
          </label>
        </div>
      )}

      {req.questions > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Step 5 · Answer {req.questions} questions</label>
          {QUESTIONS.slice(0, req.questions).map((q, i) => (
            <div key={i}>
              <p className="text-sm font-semibold mb-1.5">{q}</p>
              <textarea
                value={answers[i]} onChange={(e) => setAnswers((a) => a.map((v, j) => j === i ? e.target.value : v))}
                rows={2} placeholder="Type your answer…"
                className="w-full p-2.5 rounded-xl bg-input border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      )}

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
