import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Crown, ArrowUpRight, Wrench, Wallet, ShoppingBag, Sparkles, ChevronRight,
  Star, UserCircle2, LogOut, Flame,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "./AppShell";
import { AnimatedCounter } from "./AnimatedCounter";
import {
  loadProfile, getMaintenance, setSessionId, listAvailableProducts, myReviews,
  earningsBetween, myTransactions, todaysReviewCount, greetingFor, topReferrersThisMonth,
  type Profile, type Product, type PointsTx, type ReviewSubmission,
} from "@/lib/api";
import { getTier, getNextTier } from "@/lib/tiers";
import { formatKsh, timeAgo } from "@/lib/format";

const DAILY_GOAL = 5;
const GOAL_BONUS = 200;

function firstName(s: string) { return (s || "").trim().split(/\s+/)[0] || "there"; }

export function Dashboard({ user, setUser, onLogout }: {
  user: Profile; setUser: (u: Profile) => void; onLogout: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [maintenance, setMaint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayEarn, setTodayEarn] = useState(0);
  const [weekEarn, setWeekEarn] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);
  const [recent, setRecent] = useState<PointsTx[]>([]);
  const [myRev, setMyRev] = useState<(ReviewSubmission & { product?: Product })[]>([]);
  const [topRefs, setTopRefs] = useState<{ user_id: string; display_name: string; total: number }[]>([]);
  const [now, setNow] = useState(new Date());

  const tier = useMemo(() => getTier(user.tier), [user.tier]);
  const nextTier = getNextTier(tier.name);
  const greeting = greetingFor(now);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  async function refresh() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 86400 * 1000);
    const [fresh, prods, maint, te, we, rc, txs, rev, refs] = await Promise.all([
      loadProfile(user.id),
      listAvailableProducts(user.id),
      getMaintenance(),
      earningsBetween(user.id, today.toISOString()),
      earningsBetween(user.id, weekAgo.toISOString()),
      todaysReviewCount(user.id),
      myTransactions(user.id, 8),
      myReviews(user.id, 5),
      topReferrersThisMonth(5),
    ]);
    if (fresh) setUser(fresh);
    setProducts(prods); setMaint(maint);
    setTodayEarn(te); setWeekEarn(we);
    setTodayReviews(rc); setRecent(txs); setMyRev(rev);
    setTopRefs(refs);
    setLoading(false);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const featured = [...products].sort((a, b) => b.points_reward - a.points_reward).slice(0, 5);
  const goalPct = Math.min(100, (todayReviews / DAILY_GOAL) * 100);

  return (
    <AppShell user={user}>
      <div className="px-5 pt-5 max-w-xl mx-auto">
        {maintenance && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
            <Wrench className="size-5 text-gold shrink-0" />
            <div>
              <p className="font-semibold text-sm">System under maintenance</p>
              <p className="text-xs text-muted-foreground">New reviews are temporarily paused.</p>
            </div>
          </div>
        )}

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {now.toLocaleDateString(undefined, { weekday: "long" })} · {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <h1 className="text-2xl font-bold mt-1">
            {greeting}, <span className="text-gradient-gold">@{user.display_name || user.full_name}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-gold/15 text-gold text-[10px] font-bold tracking-wide">{tier.name}</span>
            <span className="font-mono text-[11px]">{user.worker_id}</span>
            {(user.review_streak ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-orange-400 font-semibold"><Flame className="size-3" /> {user.review_streak} day streak</span>
            )}
          </p>
        </motion.div>

        {/* Hero balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-5 shadow-elegant mb-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-primary opacity-25 blur-2xl" />
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Available balance</p>
          <div className="flex items-end justify-between mt-1">
            <AnimatedCounter value={user.points} className="text-4xl font-bold text-gradient-gold" />
            <Link to="/redeem" className="text-xs text-gold flex items-center gap-1 hover:underline">
              Withdraw <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">≈ {formatKsh(user.points)} · 1 point = KSh 1</p>
        </motion.div>

        {/* New products count */}
        {!loading && (
          <Link to="/products" className="mb-4 flex items-center justify-between rounded-2xl glass border border-primary/40 p-4 active:scale-[0.99] transition">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{products.length} new products available</p>
                <p className="text-xs text-muted-foreground">Fresh jobs picked for you</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-primary" />
          </Link>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard label="Today" value={formatKsh(todayEarn)} accent="primary" />
          <StatCard label="This week" value={formatKsh(weekEarn)} accent="gold" />
          <StatCard label="Reviews today" value={`${todayReviews}`} hint={`of ${DAILY_GOAL} daily goal`} />
          <StatCard label="Lifetime reviews" value={`${user.reviews_approved ?? 0}`} hint="approved" />
        </div>

        {/* Daily goal */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 mb-5 border border-gold/30 bg-gradient-to-br from-gold/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-gold" />
              <p className="text-sm font-semibold">Daily goal</p>
            </div>
            <p className="text-xs text-muted-foreground">{todayReviews}/{DAILY_GOAL} reviews</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-background/60 overflow-hidden">
            <motion.div animate={{ width: `${goalPct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="h-full bg-gradient-gold" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Complete {DAILY_GOAL} reviews today to earn <span className="text-gold font-semibold">+{GOAL_BONUS} bonus points</span>.
          </p>
        </motion.div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link to="/products" className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center"><ShoppingBag className="size-5 text-primary" /></div>
            <p className="text-xs font-semibold">Reviews</p>
          </Link>
          <Link to="/redeem" className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition">
            <div className="size-10 rounded-xl bg-gold/20 flex items-center justify-center"><Wallet className="size-5 text-gold" /></div>
            <p className="text-xs font-semibold">Withdraw</p>
          </Link>
          <Link to="/profile" className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition">
            <div className="size-10 rounded-xl bg-accent flex items-center justify-center"><UserCircle2 className="size-5 text-foreground" /></div>
            <p className="text-xs font-semibold">Profile</p>
          </Link>
        </div>

        {/* Featured carousel */}
        <SectionHeader title="Featured jobs" to="/products" />
        {loading ? <div className="h-32 glass rounded-2xl shimmer mb-6" /> : (
          <div className="-mx-5 mb-6 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 px-5">
              {featured.map((p) => (
                <Link key={p.id} to="/products"
                  className="shrink-0 w-56 glass rounded-2xl overflow-hidden active:scale-[0.98] transition">
                  <div className="h-32 bg-muted overflow-hidden">
                    <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.platform}</p>
                    <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-muted-foreground">{p.est_minutes}</p>
                      <p className="text-sm font-bold text-gradient-gold">+{p.points_reward}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {featured.length === 0 && <p className="text-sm text-muted-foreground py-8">All caught up — check back soon!</p>}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <SectionHeader title="Recent activity" />
        <div className="glass rounded-2xl divide-y divide-border/40 mb-6">
          {recent.length === 0 && myRev.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No activity yet. Start your first review!</p>
          )}
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{tx.reason}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(tx.created_at)}</p>
              </div>
              <p className={`text-sm font-bold ${tx.delta >= 0 ? "text-gradient-gold" : "text-destructive"}`}>
                {tx.delta >= 0 ? "+" : ""}{tx.delta.toLocaleString()} pts
              </p>
            </div>
          ))}
          {recent.length === 0 && myRev.length > 0 && myRev.slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">Reviewed {r.product?.name ?? "product"}</p>
                <p className="text-xs text-muted-foreground capitalize">{r.status} · {timeAgo(r.created_at)}</p>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-3 fill-gold text-gold" />)}
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade nudge */}
        {nextTier && (
          <Link to="/upgrade"
            className="flex items-center justify-between rounded-2xl p-4 glass border border-gold/30 active:scale-[0.99] transition mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold shrink-0">
                <Crown className="size-5 text-gold-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-gold">Next tier</p>
                <p className="text-sm font-semibold truncate">
                  Unlock <span className="text-gradient-gold">{nextTier.name}</span> for {formatKsh(nextTier.priceKsh ?? 0)}
                </p>
              </div>
            </div>
            <ChevronRight className="size-5 text-gold" />
          </Link>
        )}

        <button
          onClick={() => { setSessionId(null); onLogout(); }}
          className="w-full h-12 rounded-xl glass flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: "primary" | "gold" }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${accent === "gold" ? "text-gradient-gold" : accent === "primary" ? "text-gradient-primary" : ""}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {to && <Link to={to} className="text-xs text-primary flex items-center gap-1 hover:underline">See all <ChevronRight className="size-3" /></Link>}
    </div>
  );
}
