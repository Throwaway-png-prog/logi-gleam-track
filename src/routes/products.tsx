import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Star, X, Sparkles, BookOpen, RefreshCw, Lock, Crown } from "lucide-react";
import { listAvailableProducts, getSessionId, loadProfile, type Product, type Profile } from "@/lib/api";
import { formatKsh } from "@/lib/format";
import { shuffleForUser } from "@/lib/security";
import { vipForReward, rewardBandLabel } from "@/lib/jobGenerator";
import { AppShell } from "@/components/AppShell";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewGuidelinesModal, hasAckedGuidelines } from "@/components/ReviewGuidelinesModal";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "Reviews — LogiBack Earn" }] }),
});

const CATEGORIES = ["All", "Electronics", "Fashion", "Home & Living", "Beauty", "Groceries"];

function ProductsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState<Product | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [pending, setPending] = useState<Product | null>(null);
  const [shuffleSalt, setShuffleSalt] = useState(0);

  async function load() {
    const sid = getSessionId();
    if (!sid) { navigate({ to: "/app" }); return; }
    const u = await loadProfile(sid);
    if (!u) { navigate({ to: "/app" }); return; }
    setUser(u);
    const p = await listAvailableProducts(u.id);
    setProducts(p); setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function openProduct(p: Product) {
    const required = vipForReward(p.points_reward);
    const myVip = (user as any)?.vip_level ?? 0;
    if (required > myVip) {
      // Locked by VIP gate — bounce to unified VIP upgrade page with the
      // required tier preselected.
      navigate({ to: "/vip", search: { level: required } as any });
      return;
    }
    if (!hasAckedGuidelines()) { setPending(p); setShowGuidelines(true); return; }
    setSelected(p);
  }

  const filtered = useMemo(() => {
    const base = products.filter((p) =>
      (cat === "All" || p.category === cat) &&
      (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()))
    );
    return user ? shuffleForUser(base, user.id, shuffleSalt) : base;
  }, [products, cat, q, user, shuffleSalt]);

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <AppShell user={user}>
      <div className="px-5 pt-5 pb-8 max-w-xl mx-auto">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Earn</p>
          <h1 className="text-2xl font-bold">Product reviews</h1>
          <p className="text-sm text-gold flex items-center gap-1.5 mt-1">
            <Sparkles className="size-3.5" /> {products.length} new products available
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => setShowGuidelines(true)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full glass border border-gold/40 text-xs font-semibold text-gold">
              <BookOpen className="size-3.5" /> Review Guidelines
            </button>
            <button onClick={() => setShuffleSalt((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full glass text-xs font-semibold text-muted-foreground hover:text-foreground">
              <RefreshCw className="size-3.5" /> Shuffle
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <input placeholder="Search products or brands" value={q} onChange={(e) => setQ(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 mb-5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 h-9 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                cat === c ? "bg-gradient-primary text-primary-foreground shadow-glow" : "glass text-muted-foreground"
              }`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden">
                <div className="aspect-square bg-muted/40 shimmer" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-2/3 bg-muted/40 shimmer rounded" />
                  <div className="h-3 w-1/2 bg-muted/40 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p, i) => {
              const required = vipForReward(p.points_reward);
              const myVip = (user as any)?.vip_level ?? 0;
              const locked = required > myVip;
              const band = rewardBandLabel(p.points_reward);
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className={`glass rounded-2xl overflow-hidden relative ${locked ? "opacity-95" : ""}`}>
                  <button type="button" onClick={() => openProduct(p)} className="text-left block w-full active:scale-[0.98] transition">
                    <div className="aspect-square bg-muted overflow-hidden relative">
                      <img src={p.image_url} alt={p.name} loading="lazy" className={`w-full h-full object-cover ${locked ? "blur-[2px] brightness-50" : ""}`} />
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-gold text-gold-foreground text-[10px] font-bold shadow-gold">
                        +{formatKsh(p.points_reward)}
                      </div>
                      <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        band === "Premium" ? "bg-gold/90 text-gold-foreground" :
                        band === "High" ? "bg-primary/90 text-primary-foreground" :
                        band === "Medium" ? "bg-accent text-accent-foreground" : "bg-background/80 text-muted-foreground"
                      }`}>{band}</div>
                      {locked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center px-3">
                          <Lock className="size-7 text-gold drop-shadow" />
                          <p className="text-[11px] font-bold text-white">Unlock at VIP {required}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-gold text-gold-foreground font-bold flex items-center gap-1">
                            <Crown className="size-3" /> Upgrade
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        {p.platform} · <Star className="size-3 text-gold fill-gold" />
                      </p>
                      <p className="font-semibold text-sm line-clamp-1 mt-0.5">{p.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.brand}</p>
                      <p className="text-xs font-semibold mt-1">{formatKsh(p.price_ksh)}</p>
                    </div>
                  </button>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">
                {products.length === 0 ? "You've reviewed every available product. New batches drop daily." : "No products match your search."}
              </p>
            )}
          </div>
        )}
      </div>

      <ReviewGuidelinesModal
        open={showGuidelines}
        onClose={() => { setShowGuidelines(false); setPending(null); }}
        onAccept={() => { if (pending) { setSelected(pending); setPending(null); } }}
      />

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[92vh] glass rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col border border-border/60">
              <div className="flex items-center justify-between p-4 border-b border-border/40 shrink-0">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gold">Review job</p>
                  <h2 className="font-bold text-sm truncate max-w-[220px]">{selected.name}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="size-9 rounded-lg glass flex items-center justify-center"><X className="size-4" /></button>
              </div>
              <div className="overflow-y-auto p-4">
                <ReviewForm product={selected} user={user} onDone={() => { setSelected(null); load(); }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
