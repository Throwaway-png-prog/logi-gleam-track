import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, Wallet, Crown, History, X, Home, Brain } from "lucide-react";
import {
  listMessagesFor, getReadMessageIds, markMessageRead, setSessionId,
  type Profile, type Message,
} from "@/lib/api";
import { initialsOf, timeAgo, formatKsh } from "@/lib/format";
import { Logo } from "./Logo";
import { OfflineIndicator } from "./OfflineIndicator";
import { IdleTimeout } from "./IdleTimeout";

const NAV = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/products", label: "Earn", icon: ShoppingBag },
  { to: "/vip", label: "VIP", icon: Crown },
  { to: "/ai-training", label: "AI", icon: Brain },
  { to: "/redeem", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Me", icon: History },
] as const;

export function AppShell({ user, children }: { user: Profile; children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function refresh() {
    const [m, r] = await Promise.all([listMessagesFor(user), getReadMessageIds(user.id)]);
    setMessages(m); setReadIds(r);
  }
  useEffect(() => { refresh(); const t = setInterval(refresh, 60000); return () => clearInterval(t); /* eslint-disable-next-line */ }, [user.id]);

  // Apply user's theme preference only while logged in. Landing/auth/register
  // pages never mount AppShell, so they remain on the default (dark) palette.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (user.theme_pref === "light") html.classList.add("light");
    else html.classList.remove("light");
    return () => { html.classList.remove("light"); };
  }, [user.theme_pref]);

  const unread = messages.filter((m) => !readIds.has(m.id)).length;
  const location = useLocation();

  async function openCenter() {
    setOpen(true);
    const unreadMsgs = messages.filter((m) => !readIds.has(m.id));
    await Promise.all(unreadMsgs.map((m) => markMessageRead(user.id, m.id)));
    setReadIds(new Set([...readIds, ...unreadMsgs.map((m) => m.id)]));
  }

  return (
    <div className="min-h-screen">
      <OfflineIndicator />
      <IdleTimeout onTimeout={() => { setSessionId(null); navigate({ to: "/app" }); }} />

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/app"><Logo size={36} showText className="shrink-0" /></Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV.map((n) => {
              const active = location.pathname === n.to || (n.to !== "/app" && location.pathname.startsWith(n.to));
              return (
                <Link key={n.to} to={n.to}
                  className={`px-3 h-9 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}>
                  <n.icon className="size-3.5" /> {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/redeem" className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold">
              <Wallet className="size-3.5" /> {formatKsh(user.points)}
            </Link>
            <button onClick={openCenter} className="relative size-10 rounded-xl glass flex items-center justify-center" aria-label="Notifications">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 size-5 rounded-full bg-gradient-gold text-gold-foreground text-[10px] font-bold flex items-center justify-center shadow-gold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <Link to="/profile" className="size-10 rounded-xl bg-gradient-primary text-primary-foreground font-bold flex items-center justify-center shadow-glow text-sm overflow-hidden">
              {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : initialsOf(user.display_name || user.full_name)}
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-24 md:pb-8">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/85 border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6 h-16">
          {NAV.map((n) => {
            const active = location.pathname === n.to || (n.to !== "/app" && location.pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to}
                className={`flex flex-col items-center justify-center gap-0.5 transition ${active ? "text-gold" : "text-muted-foreground"}`}>
                <n.icon className="size-5" />
                <span className="text-[10px] font-semibold">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end p-0 sm:p-4"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[80vh] glass sm:rounded-3xl overflow-hidden flex flex-col border border-border/60">
              <div className="flex items-center justify-between p-5 border-b border-border/40">
                <h2 className="font-bold flex items-center gap-2"><Bell className="size-5 text-gold" /> Notifications</h2>
                <button onClick={() => setOpen(false)} className="size-9 rounded-lg glass flex items-center justify-center"><X className="size-4" /></button>
              </div>
              <div className="overflow-y-auto flex-1">
                {messages.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
                ) : messages.map((m) => (
                  <div key={m.id} className="p-4 border-b border-border/30">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-sm">{m.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(m.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{m.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
