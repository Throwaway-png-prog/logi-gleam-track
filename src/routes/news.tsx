import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Send, Loader2, Megaphone, Star, Trophy, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  getSessionId, loadProfile, listNews, likeNews, newsStats, listNewsComments, postNewsComment,
  type Profile, type NewsItem,
} from "@/lib/api";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/news")({
  component: NewsPage,
  head: () => ({ meta: [{ title: "News — LogiBack Earn" }] }),
});

function NewsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<Map<string, { likes: number; liked: boolean; comments: number }>>(new Map());
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh(u: Profile) {
    const list = await listNews(40);
    setItems(list);
    const s = await newsStats(list.map((i) => i.id), u.id);
    setStats(s);
  }

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { navigate({ to: "/app" }); return; }
    loadProfile(sid).then(async (u) => {
      if (!u) { navigate({ to: "/app" }); return; }
      setUser(u);
      await refresh(u);
      setLoading(false);
    });
  }, [navigate]);

  async function toggleLike(id: string) {
    if (!user) return;
    const res = await likeNews(id, user.id);
    const next = new Map(stats);
    const cur = next.get(id) ?? { likes: 0, liked: false, comments: 0 };
    next.set(id, { ...cur, liked: res.liked, likes: res.count });
    setStats(next);
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  return (
    <AppShell user={user}>
      <div className="px-5 pt-5 pb-8 max-w-xl mx-auto">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold">Community feed</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="size-6 text-gold" /> What's happening
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Top reviewers, platform updates, and recent reviews from the community.</p>
        </div>

        {items.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground">
            No news yet. Check back soon!
          </div>
        )}

        <div className="space-y-4">
          {items.map((n, i) => {
            const s = stats.get(n.id) ?? { likes: 0, liked: false, comments: 0 };
            const isReview = n.id.startsWith("rev-");
            return (
              <motion.article
                key={n.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass rounded-3xl overflow-hidden border border-border/40"
              >
                {n.image_url && (
                  <div className="h-44 bg-muted overflow-hidden">
                    <img src={n.image_url} alt={n.title} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <KindBadge kind={n.kind} />
                    <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(n.created_at)}</span>
                  </div>
                  <h2 className="font-bold text-base">{n.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap">{n.body}</p>

                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <button
                      onClick={() => toggleLike(n.id)}
                      disabled={isReview}
                      className={`flex items-center gap-1.5 transition ${s.liked ? "text-rose-400" : "text-muted-foreground"} ${isReview ? "opacity-60" : "hover:text-rose-400"}`}
                    >
                      <Heart className={`size-4 ${s.liked ? "fill-rose-400" : ""}`} /> {s.likes}
                    </button>
                    <button
                      onClick={() => !isReview && setOpenComments(n.id)}
                      disabled={isReview}
                      className={`flex items-center gap-1.5 transition ${isReview ? "opacity-60 text-muted-foreground" : "text-muted-foreground hover:text-primary"}`}
                    >
                      <MessageCircle className="size-4" /> {s.comments}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {openComments && (
        <CommentsDrawer
          newsId={openComments}
          userId={user.id}
          onClose={() => { setOpenComments(null); refresh(user); }}
        />
      )}
    </AppShell>
  );
}

function KindBadge({ kind }: { kind: NewsItem["kind"] }) {
  const map = {
    announcement: { icon: Megaphone, label: "Announcement", cls: "bg-primary/15 text-primary" },
    spotlight: { icon: Sparkles, label: "Spotlight", cls: "bg-gold/15 text-gold" },
    top_reviewer: { icon: Trophy, label: "Top Reviewer", cls: "bg-orange-500/15 text-orange-400" },
    review: { icon: Star, label: "Community Review", cls: "bg-emerald-500/15 text-emerald-400" },
  };
  const m = map[kind];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${m.cls}`}>
      <m.icon className="size-3" /> {m.label}
    </span>
  );
}

function CommentsDrawer({ newsId, userId, onClose }: { newsId: string; userId: string; onClose: () => void }) {
  const [comments, setComments] = useState<{ id: string; body: string; display_name: string; created_at: string }[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() { setComments(await listNewsComments(newsId)); }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [newsId]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    await postNewsComment(newsId, userId, text.trim());
    setText("");
    await load();
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="font-bold">Comments</h3>
          <button onClick={onClose} className="size-9 rounded-lg glass flex items-center justify-center"><X className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Be the first to comment!</p>}
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <p className="font-semibold">{c.display_name} <span className="text-[10px] text-muted-foreground font-normal ml-1">{timeAgo(c.created_at)}</span></p>
              <p className="text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border/40 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…"
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="flex-1 h-11 px-3 rounded-xl bg-input border border-border text-sm" />
          <button onClick={send} disabled={sending || !text.trim()}
            className="size-11 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
