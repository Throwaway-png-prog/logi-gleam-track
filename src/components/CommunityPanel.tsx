import { useEffect, useState } from "react";
import { Send, MessageCircle, User, Landmark } from "lucide-react";
import { getCommunityLinks, getMyManager, managerContactUrl, type Manager, type CommunityLinks } from "@/lib/community";

export function CommunityPanel({ userId }: { userId: string }) {
  const [links, setLinks] = useState<CommunityLinks | null>(null);
  const [manager, setManager] = useState<Manager | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [l, m] = await Promise.all([getCommunityLinks(), getMyManager(userId)]);
      if (cancelled) return;
      setLinks(l); setManager(m);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="glass rounded-2xl p-4 mb-5 border border-primary/30">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Community & support</p>
      <div className="grid gap-2">
        <a href={links?.telegram_url ?? "#"} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 rounded-xl p-3 bg-[oklch(0.55_0.15_240/0.12)] border border-[oklch(0.55_0.15_240/0.35)] active:scale-[0.99] transition">
          <span className="size-10 rounded-xl bg-[oklch(0.55_0.15_240)] flex items-center justify-center">
            <Send className="size-5 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Telegram Community</p>
            <p className="text-xs text-muted-foreground">Announcements, tips, weekly leaderboard</p>
          </div>
        </a>
        <a href={links?.whatsapp_url ?? "#"} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 rounded-xl p-3 bg-success/15 border border-success/35 active:scale-[0.99] transition">
          <span className="size-10 rounded-xl bg-success flex items-center justify-center">
            <MessageCircle className="size-5 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">WhatsApp Community</p>
            <p className="text-xs text-muted-foreground">Live chat with other reviewers</p>
          </div>
        </a>
        {manager && (
          <a href={managerContactUrl(manager)} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 rounded-xl p-3 bg-gold/15 border border-gold/35 active:scale-[0.99] transition">
            <span className="size-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <User className="size-5 text-gold-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Personal Manager — {manager.name}</p>
              <p className="text-xs text-muted-foreground">
                {manager.telegram_handle ? `Telegram @${manager.telegram_handle.replace(/^@/, "")}` : "Tap to chat on Telegram"}
              </p>
            </div>
          </a>
        )}
        {links?.paybill_number && (
          <div className="flex items-center gap-3 rounded-xl p-3 bg-accent/30 border border-border">
            <span className="size-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Landmark className="size-5 text-primary-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{links.paybill_label}</p>
              <p className="text-xs text-muted-foreground font-mono">Paybill: {links.paybill_number}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
