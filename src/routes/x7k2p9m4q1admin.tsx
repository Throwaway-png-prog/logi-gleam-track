import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck, Loader2, Users, Package, MessageSquare, Activity, Coins, Settings, Send, Plus, Edit,
} from "lucide-react";
import {
  listProfiles, adminListAllReviews, adminListAllRedemptions, adminFinancialStats,
  adminUpsertProduct, sendMessage, getSystemSettings, setMaintenance, setRedemptionsOnHold,
  setRegistrationOpen, getRegistrationOpen, listProducts,
  type Profile, type Product,
} from "@/lib/api";
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

type Tab = "overview" | "users" | "products" | "messages" | "logs" | "settings";

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <ShieldCheck className="size-5 text-gold-foreground" />
            </div>
            <span className="font-bold">Admin Console</span>
          </div>
          <button onClick={() => { sessionStorage.removeItem("admin_ok"); location.reload(); }}
            className="text-xs text-muted-foreground">Sign out</button>
        </div>
        <div className="max-w-6xl mx-auto px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {([
            ["overview", "Overview", Coins],
            ["users", "Users", Users],
            ["products", "Products", Package],
            ["messages", "Broadcast", MessageSquare],
            ["logs", "Logs", Activity],
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
      <main className="max-w-6xl mx-auto px-5 py-6">
        {tab === "overview" && <Overview />}
        {tab === "users" && <UsersTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "logs" && <LogsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminFinancialStats>> | null>(null);
  useEffect(() => { adminFinancialStats().then(setStats); }, []);
  if (!stats) return <Loader2 className="size-6 animate-spin" />;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-5">Financial overview</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Metric label="Points in circulation" value={stats.pointsInCirculation.toLocaleString()} sub={`≈ ${formatKsh(stats.pointsInCirculation)}`} />
        <Metric label="Paid out (M-Pesa)" value={formatKsh(stats.pointsPaidOut)} accent="gold" />
        <Metric label="Pending payouts" value={formatKsh(stats.pendingPayouts)} accent="primary" />
        <Metric label="Total users" value={stats.totalUsers.toLocaleString()} />
        <Metric label="Active products" value={stats.totalProducts.toLocaleString()} />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "gold" | "primary" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${accent === "gold" ? "text-gradient-gold" : accent === "primary" ? "text-gradient-primary" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { listProfiles().then(setUsers); }, []);
  const filtered = users.filter((u) =>
    !q || u.phone.includes(q) || (u.display_name ?? "").toLowerCase().includes(q.toLowerCase()) || (u.full_name ?? "").toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Users ({users.length})</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone"
          className="h-10 px-3 rounded-lg bg-input border border-border text-sm" />
      </div>
      <div className="glass rounded-2xl divide-y divide-border/40 overflow-hidden">
        {filtered.map((u) => (
          <div key={u.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm">@{u.display_name || u.full_name}</p>
              <p className="text-xs text-muted-foreground font-mono">{u.phone} · {u.worker_id}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gradient-gold">{u.points.toLocaleString()} pts</p>
              <p className="text-[10px] text-muted-foreground">{u.tier} · {u.reviews_approved ?? 0} ✓</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No users found.</p>}
      </div>
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
    toast.success(editing.id ? "Product updated" : "Product created");
    setEditing(null);
    load();
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
                <span className="text-xs text-gradient-gold font-bold">+{p.points_reward} pts</span>
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
              <Field label="Points reward" v={String(editing.points_reward ?? "")} on={(v) => setEditing({ ...editing, points_reward: Number(v) })} />
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

function Field({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input value={v} onChange={(e) => on(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-input border border-border" />
    </label>
  );
}

function MessagesTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "tier" | "user">("all");
  const [audValue, setAudValue] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    await sendMessage({ title, body, audience, audience_value: audience === "all" ? null : audValue });
    toast.success("Broadcast sent");
    setTitle(""); setBody(""); setAudValue("");
    setSending(false);
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold mb-5">Broadcast message</h2>
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
        {audience !== "all" && (
          <Field label={audience === "tier" ? "Tier name (Starter, Operator…)" : "User ID"} v={audValue} on={setAudValue} />
        )}
        <Field label="Title" v={title} on={setTitle} />
        <label className="block">
          <span className="text-xs text-muted-foreground">Message</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
            className="mt-1 w-full p-3 rounded-lg bg-input border border-border text-sm" />
        </label>
        <button onClick={send} disabled={sending} className="w-full h-12 rounded-lg bg-gradient-gold text-gold-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send broadcast
        </button>
      </div>
    </div>
  );
}

function LogsTab() {
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof adminListAllReviews>>>([]);
  const [reds, setReds] = useState<Awaited<ReturnType<typeof adminListAllRedemptions>>>([]);
  useEffect(() => {
    adminListAllReviews(50).then(setReviews);
    adminListAllRedemptions(50).then(setReds);
  }, []);
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div>
        <h3 className="text-lg font-bold mb-3">Recent reviews</h3>
        <div className="glass rounded-2xl divide-y divide-border/40 overflow-hidden max-h-[600px] overflow-y-auto">
          {reviews.map((r) => (
            <div key={r.id} className="p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold truncate">{r.product?.name ?? "Product"}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded capitalize ${r.status === "approved" ? "bg-success/15 text-success" : r.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">by @{r.profile?.display_name ?? "user"} · {timeAgo(r.created_at)}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No reviews yet.</p>}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-3">Recent redemptions</h3>
        <div className="glass rounded-2xl divide-y divide-border/40 overflow-hidden max-h-[600px] overflow-y-auto">
          {reds.map((r) => (
            <div key={r.id} className="p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{formatKsh(r.ksh_value)}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded capitalize ${r.status === "completed" ? "bg-success/15 text-success" : r.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-gold/15 text-gold"}`}>{r.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">@{r.profile?.display_name ?? "user"} · {timeAgo(r.created_at)}</p>
            </div>
          ))}
          {reds.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No redemptions yet.</p>}
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
      <Toggle label="Maintenance mode" desc="Disables new review submissions" v={maint} on={async (v) => { setMaint(v); await setMaintenance(v); toast.success(v ? "Maintenance ON" : "Maintenance OFF"); }} />
      <Toggle label="Redemptions on hold" desc="Disables M-Pesa withdrawals" v={hold} on={async (v) => { setHold(v); await setRedemptionsOnHold(v); toast.success(v ? "Redemptions on hold" : "Redemptions active"); }} />
      <Toggle label="Registration open" desc="Allow new sign-ups" v={regOpen} on={async (v) => { setRegOpen(v); await setRegistrationOpen(v); toast.success(v ? "Registration open" : "Registration closed"); }} />
    </div>
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
        <span className={`absolute top-0.5 size-6 rounded-full bg-white transition-transform ${v ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
