import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck, Loader2, Users, Package, MessageSquare, Activity, Coins, Settings, Send, Plus, Edit,
  Trash2, Search, AlertTriangle, Ban, Wand2, UserX, FileDown, Phone as PhoneIcon, Newspaper, Crown,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from "recharts";
import {
  listProfiles, adminUpsertProduct, sendMessage, getSystemSettings, setMaintenance, setRedemptionsOnHold,
  setRegistrationOpen, getRegistrationOpen, listProducts, startEmergency, stopEmergency,
  softDeleteProduct, setMinRedemption,
  listPendingReviews, approveReview, rejectReview,
  type Profile, type Product, type ReviewSubmission,
} from "@/lib/api";
import {
  getDailyAnalytics, listAdminActions, listLoginAttempts, listPaymentNumbers, addPaymentNumber,
  togglePaymentNumber, deletePaymentNumber, adminWarnUser, adminBlockUser, adminUnblockUser,
  adminAdjustBalance, adminForceTier, adminSoftDelete, getUserDetail, listAllNews, upsertNews,
  rowsToCSV, downloadCSV, type PaymentNumber,
} from "@/lib/admin";
import { listFraudFlags, clearFraudFlag, resetFraudScore } from "@/lib/security";
import { TIERS } from "@/lib/tiers";
import { formatKsh, timeAgo } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/x7k2p9m4q1admin")({
  component: AdminPanel,
  head: () => ({ meta: [{ title: "Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

const ADMIN_PIN = "778899Admin2024";

function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_ok") === "1") setAuthed(true);
  }, []);

  function tryLogin() {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("admin_ok", "1");
      setAuthed(true);
    } else setErr("Invalid PIN");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="glass rounded-3xl p-8 w-full max-w-sm shadow-elegant">
          <ShieldCheck className="size-10 text-gold mx-auto mb-4" />
          <h1 className="text-xl font-bold text-center">Restricted access</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Enter administrator PIN to continue.</p>
          <input
            type="password" value={pin} onChange={(e) => { setPin(e.target.value); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="••••••••••" className="mt-5 w-full h-12 px-4 rounded-xl bg-input border border-border text-center font-mono"
          />
          {err && <p className="text-xs text-destructive text-center mt-2">{err}</p>}
          <button onClick={tryLogin} className="mt-4 w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-bold">Unlock</button>
        </div>
      </div>
    );
  }
  return <AdminDashboard />;
}

type Tab = "analytics" | "users" | "products" | "reviews" | "news" | "payments" | "messages" | "logs" | "fraud" | "settings";

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("analytics");
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/85 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <ShieldCheck className="size-5 text-gold-foreground" />
            </div>
            <span className="font-bold">Admin Console</span>
          </div>
          <button onClick={() => { sessionStorage.removeItem("admin_ok"); location.reload(); }}
            className="text-xs text-muted-foreground">Sign out</button>
        </div>
        <div className="max-w-7xl mx-auto px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {([
            ["analytics", "Analytics", Coins],
            ["users", "Users", Users],
            ["products", "Products", Package],
            ["reviews", "Reviews", MessageSquare],
            ["news", "News", Newspaper],
            ["payments", "Payment #s", PhoneIcon],
            ["messages", "Broadcast", MessageSquare],
            ["logs", "Security", Activity],
            ["fraud", "Fraud", AlertTriangle],
            ["settings", "Settings", Settings],
          ] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k as Tab)}
              className={`px-3 h-9 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                tab === k ? "bg-gradient-primary text-primary-foreground shadow-glow" : "glass text-muted-foreground"
              }`}>
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-5 py-6">
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "news" && <NewsTab />}
        {tab === "payments" && <PaymentsTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "logs" && <SecurityTab />}
        {tab === "fraud" && <FraudTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function AnalyticsTab() {
  const [s, setS] = useState<Awaited<ReturnType<typeof getDailyAnalytics>> | null>(null);
  useEffect(() => { getDailyAnalytics(30).then(setS); }, []);
  if (!s) return <Loader2 className="size-6 animate-spin" />;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Metric label="Total users" value={s.totalUsers.toLocaleString()} />
        <Metric label="Active today" value={s.activeToday.toLocaleString()} accent="primary" />
        <Metric label="New this week" value={s.newThisWeek.toLocaleString()} accent="gold" />
        <Metric label="Revenue (upgrade fees)" value={formatKsh(s.totalRevenue)} accent="gold" />
        <Metric label="Total paid out" value={formatKsh(s.totalPayout)} />
        <Metric label="Platform balance" value={formatKsh(s.platformBalance)} accent={s.platformBalance >= 0 ? "primary" : undefined} />
        <Metric label="Pending payouts" value={formatKsh(s.pendingPayoutKsh)} />
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">30-day earnings vs payouts (KSh)</p>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={s.buckets}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="earnings" fill="oklch(0.62 0.18 155)" name="Earnings" />
              <Bar dataKey="payouts" fill="oklch(0.85 0.17 86)" name="Payouts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">30-day new user signups</p>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={s.newUsersByDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="count" stroke="oklch(0.85 0.17 86)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Top 10 earners</p>
        <ul className="divide-y divide-border/40">
          {s.topEarners.map((e, i) => (
            <li key={e.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="size-7 rounded-full bg-gold/15 text-gold text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">@{e.display_name}</p>
                  <p className="text-xs text-muted-foreground">{e.tier}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gradient-gold">{formatKsh(e.points)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "gold" | "primary" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${accent === "gold" ? "text-gradient-gold" : accent === "primary" ? "text-gradient-primary" : ""}`}>{value}</p>
    </motion.div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null);

  async function load() { setUsers(await listProfiles()); }
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) =>
    !q || u.phone.includes(q) || (u.display_name ?? "").toLowerCase().includes(q.toLowerCase()) || (u.full_name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold">Users ({users.length})</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone"
            className="h-10 pl-9 pr-3 rounded-lg bg-input border border-border text-sm" />
        </div>
      </div>
      <div className="glass rounded-2xl divide-y divide-border/40 overflow-hidden">
        {filtered.map((u) => (
          <button key={u.id} onClick={() => setSelected(u)} className="w-full p-4 flex items-center justify-between gap-3 hover:bg-accent/30 text-left">
            <div className="min-w-0">
              <p className="font-semibold text-sm flex items-center gap-2">
                @{u.display_name || u.full_name}
                {(u as any).blocked && <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-bold">BLOCKED</span>}
                {((u as any).warnings ?? 0) > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/15 text-gold font-bold">⚠ {(u as any).warnings}</span>}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{u.phone} · {u.worker_id}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gradient-gold">{formatKsh(u.points)}</p>
              <p className="text-[10px] text-muted-foreground">{u.tier} · {u.reviews_approved ?? 0} ✓</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No users found.</p>}
      </div>

      {selected && <UserDetailDrawer user={selected} onClose={() => setSelected(null)} onUpdated={() => { load(); setSelected(null); }} />}
    </div>
  );
}

function UserDetailDrawer({ user, onClose, onUpdated }: { user: Profile; onClose: () => void; onUpdated: () => void }) {
  const [d, setD] = useState<Awaited<ReturnType<typeof getUserDetail>> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { getUserDetail(user.id).then(setD); }, [user.id]);

  async function withReason(action: (reason: string) => Promise<void>, prompt: string) {
    const reason = window.prompt(prompt);
    if (!reason) return;
    setBusy(true);
    try { await action(reason); toast.success("Done"); onUpdated(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function adjust() {
    const amt = Number(window.prompt("Adjust balance by (KSh, can be negative):", "0"));
    if (!amt) return;
    const reason = window.prompt("Reason for adjustment (required):");
    if (!reason) return;
    setBusy(true);
    try { await adminAdjustBalance(user.id, amt, reason); toast.success(`Adjusted ${amt > 0 ? "+" : ""}${amt}`); onUpdated(); }
    finally { setBusy(false); }
  }
  async function forceTier() {
    const t = window.prompt(`Force tier (${TIERS.map((x) => x.name).join("/")})`, user.tier);
    if (!t || !TIERS.find((x) => x.name === t)) return;
    setBusy(true);
    try { await adminForceTier(user.id, t); toast.success(`Set to ${t}`); onUpdated(); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="w-full sm:max-w-2xl max-h-[92vh] glass rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col border border-border/60" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">@{user.display_name}</h2>
              <p className="text-xs text-muted-foreground font-mono">{user.phone} · {user.worker_id} · {user.tier}</p>
            </div>
            <button onClick={onClose} className="size-9 rounded-lg glass">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <ActionBtn icon={AlertTriangle} label="Warn" tone="gold" disabled={busy}
              onClick={() => withReason((r) => adminWarnUser(user.id, r), "Reason for warning:")} />
            {(user as any).blocked
              ? <ActionBtn icon={ShieldCheck} label="Unblock" tone="success" disabled={busy}
                  onClick={async () => { setBusy(true); await adminUnblockUser(user.id); toast.success("Unblocked"); onUpdated(); }} />
              : <ActionBtn icon={Ban} label="Block" tone="destructive" disabled={busy}
                  onClick={() => withReason((r) => adminBlockUser(user.id, r), "Reason for blocking:")} />}
            <ActionBtn icon={Coins} label="Adjust KSh" tone="primary" disabled={busy} onClick={adjust} />
            <ActionBtn icon={Crown} label="Force tier" tone="primary" disabled={busy} onClick={forceTier} />
            <ActionBtn icon={Wand2} label="Reset PIN" tone="gold" disabled={busy}
              onClick={() => withReason(async (r) => { await adminWarnUser(user.id, `PIN reset request: ${r}`); }, "Reason for reset (logs as warning):")} />
            <ActionBtn icon={UserX} label="Delete" tone="destructive" disabled={busy}
              onClick={() => withReason((r) => adminSoftDelete(user.id, r), "Reason for deletion:")} />
          </div>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          {!d ? <Loader2 className="size-5 animate-spin" /> : (
            <>
              <Section title={`Reviews (${d.reviews.length})`}>
                {d.reviews.slice(0, 10).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30">
                    <span className="truncate">⭐ {r.rating} · {r.review_text.slice(0, 60)}…</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded capitalize ${r.status === "approved" ? "bg-success/15 text-success" : r.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
                  </div>
                ))}
              </Section>
              <Section title={`Withdrawals (${d.redemptions.length})`}>
                {d.redemptions.slice(0, 10).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30">
                    <span>{formatKsh(r.ksh_value)}</span>
                    <span className="text-xs capitalize">{r.status} · {timeAgo(r.created_at)}</span>
                  </div>
                ))}
              </Section>
              <Section title={`Upgrades (${d.upgrades.length})`}>
                {d.upgrades.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30">
                    <span>{r.requested_tier} · {formatKsh(r.amount_paid)}</span>
                    <span className="text-xs capitalize">{r.status}</span>
                  </div>
                ))}
              </Section>
              <Section title={`Referrals (${d.referrals.length})`}>
                <p className="text-sm">Total earned: <span className="text-gold font-bold">{formatKsh(user.total_referral_earnings ?? 0)}</span></p>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, tone, onClick, disabled }: { icon: typeof Ban; label: string; tone: "gold" | "destructive" | "primary" | "success"; onClick: () => void; disabled?: boolean }) {
  const map = {
    gold: "bg-gold/15 text-gold border-gold/40",
    destructive: "bg-destructive/15 text-destructive border-destructive/40",
    primary: "bg-primary/15 text-primary border-primary/40",
    success: "bg-success/15 text-success border-success/40",
  } as const;
  return (
    <button onClick={onClick} disabled={disabled}
      className={`h-10 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 ${map[tone]}`}>
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <div>{children}</div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  async function load() { setProducts(await listProducts()); }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.name) return;
    await adminUpsertProduct(editing);
    toast.success(editing.id ? "Updated" : "Created");
    setEditing(null); load();
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Products ({products.length})</h2>
        <button onClick={() => setEditing({ active: true, points_reward: 100, est_minutes: "2-3 minutes" })}
          className="h-10 px-4 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
          <Plus className="size-4" /> Add
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => (
          <div key={p.id} className="glass rounded-2xl overflow-hidden">
            <img src={p.image_url} alt={p.name} className="h-32 w-full object-cover" />
            <div className="p-3">
              <p className="text-[10px] uppercase text-muted-foreground">{p.platform}</p>
              <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gradient-gold font-bold">{formatKsh(p.points_reward)}</span>
                <button onClick={() => setEditing(p)} className="text-xs text-primary flex items-center gap-1"><Edit className="size-3" /> Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="glass rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4">{editing.id ? "Edit product" : "New product"}</h3>
            <div className="space-y-3 text-sm">
              <Field label="Name" v={editing.name ?? ""} on={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Brand" v={editing.brand ?? ""} on={(v) => setEditing({ ...editing, brand: v })} />
              <Field label="Category" v={editing.category ?? ""} on={(v) => setEditing({ ...editing, category: v })} />
              <Field label="Platform" v={editing.platform ?? ""} on={(v) => setEditing({ ...editing, platform: v })} />
              <Field label="Image URL" v={editing.image_url ?? ""} on={(v) => setEditing({ ...editing, image_url: v })} />
              <Field label="Price (KSh)" v={String(editing.price_ksh ?? "")} on={(v) => setEditing({ ...editing, price_ksh: Number(v) })} />
              <Field label="Reward (KSh)" v={String(editing.points_reward ?? "")} on={(v) => setEditing({ ...editing, points_reward: Number(v) })} />
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 h-11 rounded-lg glass">Cancel</button>
              <button onClick={save} className="flex-1 h-11 rounded-lg bg-gradient-primary text-primary-foreground font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  async function load() { setItems(await listAllNews()); }
  useEffect(() => { load(); }, []);
  async function save() {
    if (!editing?.title || !editing?.body) return;
    await upsertNews({ id: editing.id, title: editing.title, body: editing.body, image_url: editing.image_url, kind: editing.kind ?? "announcement", featured: editing.featured });
    toast.success("Saved"); setEditing(null); load();
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">News ({items.length})</h2>
        <button onClick={() => setEditing({ kind: "announcement", featured: false })}
          className="h-10 px-4 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
          <Plus className="size-4" /> New post
        </button>
      </div>
      <div className="glass rounded-2xl divide-y divide-border/40">
        {items.map((n) => (
          <div key={n.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm flex items-center gap-2">
                {n.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-bold">FEATURED</span>}
                {n.title}
              </p>
              <p className="text-xs text-muted-foreground">{n.kind} · {timeAgo(n.created_at)}</p>
            </div>
            <button onClick={() => setEditing(n)} className="text-xs text-primary"><Edit className="size-4" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No news posts yet.</p>}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="glass rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4">{editing.id ? "Edit post" : "New post"}</h3>
            <div className="space-y-3 text-sm">
              <Field label="Title" v={editing.title ?? ""} on={(v) => setEditing({ ...editing, title: v })} />
              <label className="block">
                <span className="text-xs text-muted-foreground">Body</span>
                <textarea value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={5} className="mt-1 w-full p-3 rounded-lg bg-input border border-border text-sm" />
              </label>
              <Field label="Image URL (optional)" v={editing.image_url ?? ""} on={(v) => setEditing({ ...editing, image_url: v })} />
              <label className="block">
                <span className="text-xs text-muted-foreground">Kind</span>
                <select value={editing.kind ?? "announcement"} onChange={(e) => setEditing({ ...editing, kind: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg bg-input border border-border">
                  <option value="announcement">Announcement</option>
                  <option value="spotlight">Spotlight</option>
                  <option value="top_reviewer">Top Reviewer</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="size-4 accent-[color:var(--primary)]" />
                Feature this post (pin to top)
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 h-11 rounded-lg glass">Cancel</button>
              <button onClick={save} className="flex-1 h-11 rounded-lg bg-gradient-primary text-primary-foreground font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsTab() {
  const [nums, setNums] = useState<PaymentNumber[]>([]);
  const [label, setLabel] = useState("");
  const [msisdn, setMsisdn] = useState("");
  async function load() { setNums(await listPaymentNumbers()); }
  useEffect(() => { load(); }, []);
  async function add() {
    if (!label.trim() || !msisdn.trim()) return;
    await addPaymentNumber(label.trim(), msisdn.trim());
    setLabel(""); setMsisdn(""); load();
    toast.success("Added");
  }
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Rotating payment numbers</h2>
      <p className="text-sm text-muted-foreground mb-5">The upgrade flow picks the least-used active number to avoid Safaricom flagging. Disable any number suspected of being flagged.</p>

      <div className="glass rounded-2xl p-4 mb-5 flex flex-col sm:flex-row gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Till 2)" className="flex-1 h-11 px-3 rounded-lg bg-input border border-border text-sm" />
        <input value={msisdn} onChange={(e) => setMsisdn(e.target.value)} placeholder="0712 345 678" className="flex-1 h-11 px-3 rounded-lg bg-input border border-border text-sm font-mono" />
        <button onClick={add} className="h-11 px-4 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
          <Plus className="size-4" /> Add
        </button>
      </div>

      <div className="glass rounded-2xl divide-y divide-border/40">
        {nums.map((n) => (
          <div key={n.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm">{n.label}</p>
              <p className="text-xs text-muted-foreground font-mono">{n.msisdn}</p>
              <p className="text-[10px] text-muted-foreground">Used {n.use_count}× {n.last_used_at ? `· last ${timeAgo(n.last_used_at)}` : ""}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={async () => { await togglePaymentNumber(n.id, !n.active); load(); }}
                className={`px-3 h-9 rounded-lg text-xs font-semibold ${n.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {n.active ? "Active" : "Disabled"}
              </button>
              <button onClick={async () => { if (confirm("Delete this number?")) { await deletePaymentNumber(n.id); load(); } }}
                className="size-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
        {nums.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No payment numbers configured.</p>}
      </div>
    </div>
  );
}

function MessagesTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "tier" | "user">("all");
  const [audValue, setAudValue] = useState("");
  const [sending, setSending] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState("There has been a coordinated attack on our systems. Your data is safe. Please do not share your PIN with anyone.");
  const [emergencyDur, setEmergencyDur] = useState(30);

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    await sendMessage({ title, body, audience, audience_value: audience === "all" ? null : audValue });
    toast.success("Broadcast sent");
    setTitle(""); setBody(""); setAudValue("");
    setSending(false);
  }
  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-3">Broadcast message</h2>
        <div className="glass rounded-2xl p-5 space-y-3">
          <div>
            <span className="text-xs text-muted-foreground">Audience</span>
            <div className="flex gap-2 mt-1.5">
              {(["all", "tier", "user"] as const).map((a) => (
                <button key={a} onClick={() => setAudience(a)}
                  className={`flex-1 h-9 rounded-lg text-xs font-semibold ${audience === a ? "bg-gradient-primary text-primary-foreground" : "glass"}`}>
                  {a === "all" ? "All users" : a === "tier" ? "By tier" : "Specific user"}
                </button>
              ))}
            </div>
          </div>
          {audience !== "all" && <Field label={audience === "tier" ? "Tier name" : "User ID"} v={audValue} on={setAudValue} />}
          <Field label="Title" v={title} on={setTitle} />
          <label className="block">
            <span className="text-xs text-muted-foreground">Message</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 w-full p-3 rounded-lg bg-input border border-border text-sm" />
          </label>
          <button onClick={send} disabled={sending} className="w-full h-12 rounded-lg bg-gradient-gold text-gold-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send broadcast
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3 text-destructive flex items-center gap-2"><AlertTriangle className="size-5" /> Emergency broadcast</h2>
        <div className="glass rounded-2xl p-5 space-y-3 border border-destructive/40">
          <p className="text-xs text-muted-foreground">Triggers a non-dismissible full-screen alert with a countdown on every user's device. Type <span className="font-mono font-bold">CONFIRM</span> to authorize.</p>
          <label className="block">
            <span className="text-xs text-muted-foreground">Message</span>
            <textarea value={emergencyMsg} onChange={(e) => setEmergencyMsg(e.target.value)} rows={3} className="mt-1 w-full p-3 rounded-lg bg-input border border-border text-sm" />
          </label>
          <Field label="Duration (seconds)" v={String(emergencyDur)} on={(v) => setEmergencyDur(Number(v) || 30)} />
          <EmergencyConfirmRow
            onStart={async () => { await startEmergency(emergencyMsg, emergencyDur, "admin"); toast.success("Emergency broadcast started"); }}
            onStop={async () => { await stopEmergency(); toast.success("Stopped"); }}
          />
        </div>
      </div>
    </div>
  );
}

function EmergencyConfirmRow({ onStart, onStop }: { onStart: () => Promise<void>; onStop: () => Promise<void> }) {
  const [confirm, setConfirm] = useState("");
  const ok = confirm.trim().toUpperCase() === "CONFIRM";
  return (
    <div className="space-y-2">
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder='Type CONFIRM to enable'
        className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm font-mono"
      />
      <div className="flex gap-2">
        <button
          disabled={!ok}
          onClick={async () => { await onStart(); setConfirm(""); }}
          className="flex-1 h-11 rounded-lg bg-destructive text-destructive-foreground font-bold disabled:opacity-40 disabled:cursor-not-allowed">
          Start broadcast
        </button>
        <button onClick={onStop} className="flex-1 h-11 rounded-lg glass">Stop now</button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [actions, setActions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  useEffect(() => {
    listAdminActions(200).then(setActions);
    listLoginAttempts(200).then(setAttempts);
  }, []);

  const suspicious = useMemo(() => {
    const map = new Map<string, number>();
    attempts.filter((a) => !a.success).forEach((a) => map.set(a.phone_masked, (map.get(a.phone_masked) ?? 0) + 1));
    return [...map.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
  }, [attempts]);

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Admin action log</h3>
          <button onClick={() => downloadCSV("admin-actions.csv", rowsToCSV(actions))}
            className="text-xs flex items-center gap-1 text-gold"><FileDown className="size-3.5" /> CSV</button>
        </div>
        <div className="glass rounded-2xl divide-y divide-border/40 max-h-[600px] overflow-y-auto">
          {actions.map((a) => (
            <div key={a.id} className="p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold capitalize">{a.action.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(a.created_at)}</span>
              </div>
              {a.reason && <p className="text-xs text-muted-foreground mt-0.5">"{a.reason}"</p>}
              {a.user_id && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">user: {a.user_id.slice(0, 8)}…</p>}
            </div>
          ))}
          {actions.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No actions logged.</p>}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Login attempts</h3>
          <button onClick={() => downloadCSV("login-attempts.csv", rowsToCSV(attempts))}
            className="text-xs flex items-center gap-1 text-gold"><FileDown className="size-3.5" /> CSV</button>
        </div>
        {suspicious.length > 0 && (
          <div className="glass rounded-2xl p-4 mb-3 border border-destructive/40">
            <p className="text-xs uppercase tracking-wider text-destructive font-semibold flex items-center gap-1.5 mb-2">
              <AlertTriangle className="size-3.5" /> Suspicious activity
            </p>
            {suspicious.map(([phone, n]) => (
              <p key={phone} className="text-xs font-mono">{phone} — {n} failed attempts</p>
            ))}
          </div>
        )}
        <div className="glass rounded-2xl divide-y divide-border/40 max-h-[540px] overflow-y-auto">
          {attempts.map((a) => (
            <div key={a.id} className="p-3 text-sm flex items-center justify-between">
              <div>
                <p className="font-mono">{a.phone_masked}</p>
                <p className="text-[10px] text-muted-foreground">{timeAgo(a.attempted_at)}{a.lockout_until ? " · locked" : ""}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded ${a.success ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {a.success ? "OK" : "FAIL"}
              </span>
            </div>
          ))}
          {attempts.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No login attempts yet.</p>}
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [maint, setMaint] = useState(false);
  const [hold, setHold] = useState(false);
  const [regOpen, setRegOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const s = await getSystemSettings();
    const r = await getRegistrationOpen();
    setMaint(s.maintenance); setHold(s.redemptions_on_hold); setRegOpen(r); setLoaded(true);
  }
  useEffect(() => { load(); }, []);
  if (!loaded) return <Loader2 className="size-6 animate-spin" />;

  return (
    <div className="max-w-xl space-y-3">
      <h2 className="text-2xl font-bold mb-3">System settings</h2>
      <Toggle label="Maintenance mode" desc="Disables new review submissions" v={maint} on={async (v) => { setMaint(v); await setMaintenance(v); toast.success(v ? "Maintenance ON" : "OFF"); }} />
      <Toggle label="Redemptions on hold" desc="Disables M-Pesa withdrawals" v={hold} on={async (v) => { setHold(v); await setRedemptionsOnHold(v); toast.success(v ? "On hold" : "Active"); }} />
      <Toggle label="Registration open" desc="Allow new sign-ups" v={regOpen} on={async (v) => { setRegOpen(v); await setRegistrationOpen(v); toast.success(v ? "Open" : "Closed"); }} />
    </div>
  );
}

function FraudTab() {
  const [flags, setFlags] = useState<any[]>([]);
  const [status, setStatus] = useState<"open" | "resolved" | "all">("open");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setFlags(await listFraudFlags(status));
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-bold">Fraud detection</h2>
        <div className="flex gap-2">
          {(["open", "resolved", "all"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 h-9 rounded-full text-xs font-semibold ${status === s ? "bg-gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Rule-based detection: duplicate M-Pesa codes, shared device fingerprints, format violations. Users auto-block at score &gt; 90.
      </p>
      {loading ? <Loader2 className="size-6 animate-spin" /> : flags.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">No {status} flags.</div>
      ) : (
        <div className="space-y-2">
          {flags.map((f) => (
            <div key={f.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{f.kind} <span className="text-xs text-gold">+{f.score_delta}</span></p>
                  <p className="text-xs text-muted-foreground font-mono truncate">user: {f.user_id}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(f.created_at)}</p>
                </div>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${f.status === "open" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{f.status}</span>
              </div>
              <pre className="mt-2 text-[11px] bg-muted/30 rounded-lg p-2 overflow-x-auto">{JSON.stringify(f.evidence, null, 2)}</pre>
              {f.status === "open" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={async () => { await clearFraudFlag(f.id); toast.success("Flag resolved"); load(); }}
                    className="px-3 h-8 rounded-lg glass text-xs font-semibold">Resolve</button>
                  <button onClick={async () => { await resetFraudScore(f.user_id); toast.success("User fraud score reset"); load(); }}
                    className="px-3 h-8 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold">Reset user score</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input value={v} onChange={(e) => on(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-input border border-border" />
    </label>
  );
}
function Toggle({ label, desc, v, on }: { label: string; desc: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-center justify-between">
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button onClick={() => on(!v)} className={`w-12 h-7 rounded-full transition relative ${v ? "bg-gradient-primary" : "bg-muted"}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white transition ${v ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}
