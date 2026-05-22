import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, Star } from "lucide-react";
import { listProducts, getSessionId, type Product } from "@/lib/api";
import { formatKsh } from "@/lib/format";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "Reviews — LogiBack Earn" }] }),
});

const CATEGORIES = ["All", "Electronics", "Fashion", "Home & Living", "Beauty", "Groceries"];

function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    if (!getSessionId()) { navigate({ to: "/" }); return; }
    listProducts().then((p) => { setProducts(p); setLoading(false); });
  }, [navigate]);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      (cat === "All" || p.category === cat) &&
      (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()))
    );
  }, [products, cat, q]);

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Earn</p>
          <h1 className="text-xl font-bold">Product reviews</h1>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input
          placeholder="Search products or brands"
          value={q} onChange={(e) => setQ(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        />
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
        <div className="py-10 flex justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Link to="/products/$id" params={{ id: p.id }}
                className="block glass rounded-2xl overflow-hidden active:scale-[0.98] transition">
                <div className="aspect-square bg-muted overflow-hidden relative">
                  <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-gold text-gold-foreground text-[10px] font-bold shadow-gold">
                    +{p.points_reward}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    {p.platform} · <Star className="size-3 text-gold fill-gold" />
                  </p>
                  <p className="font-semibold text-sm line-clamp-1 mt-0.5">{p.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.brand}</p>
                  <p className="text-xs font-semibold mt-1">{formatKsh(p.price_ksh)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">No products match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}
