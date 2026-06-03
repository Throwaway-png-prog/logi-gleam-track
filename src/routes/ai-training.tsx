import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Brain, Lock, ArrowLeft, Image as ImageIcon, Type, AudioLines, Crown, Loader2, CheckCircle2 } from "lucide-react";
import { getSessionId, loadProfile, type Profile } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { formatKsh } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-training")({
  component: AITrainingPage,
  head: () => ({ meta: [{ title: "AI Training Hub — LogiBack Earn" }] }),
});

interface AITask {
  key: string;
  kind: "image" | "text" | "audio";
  title: string;
  description: string;
  example: string;
  reward_ksh: number;
}

const TASKS: AITask[] = [
  { key: "img_tag_objects", kind: "image", title: "Tag objects in this image", description: "Identify and tag visible objects to train recognition models.", example: "e.g. tag: car, traffic light, pedestrian", reward_ksh: 1200 },
  { key: "img_quality_check", kind: "image", title: "Verify image quality", description: "Confirm sharpness, lighting, and labelling accuracy.", example: "Pass / fail with one-line note", reward_ksh: 1000 },
  { key: "text_categorize", kind: "text", title: "Categorize customer messages", description: "Sort short snippets into intent buckets (refund, question, praise).", example: "10 snippets per batch", reward_ksh: 1500 },
  { key: "text_sentiment", kind: "text", title: "Sentiment review", description: "Tag whether short reviews are positive, neutral, or negative.", example: "Batch of 15", reward_ksh: 1800 },
  { key: "audio_transcribe", kind: "audio", title: "Audio transcription check", description: "Verify a 30-second auto-transcript matches the audio clip.", example: "Mark correct / fix words", reward_ksh: 3500 },
  { key: "audio_label", kind: "audio", title: "Label background sounds", description: "Tag short audio clips with the dominant sound type.", example: "e.g. traffic, indoor, music", reward_ksh: 5000 },
];

const MIN_VIP = 3;

function AITrainingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  async function refresh(id: string) {
    const p = await loadProfile(id);
    if (p) setUser(p);
    const { data } = await supabase
      .from("ai_training_completions" as any)
      .select("task_key, created_at")
      .eq("user_id", id)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString());
    setCompleted(new Set(((data as any[]) ?? []).map((r) => r.task_key)));
    setLoading(false);
  }

  useEffect(() => {
    const id = getSessionId();
    if (!id) { navigate({ to: "/app" }); return; }
    refresh(id);
  }, [navigate]);

  const vipLevel = (user as any)?.vip_level ?? 0;
  const unlocked = vipLevel >= MIN_VIP;

  async function complete(task: AITask) {
    if (!user || !unlocked || completed.has(task.key) || working) return;
    setWorking(task.key);
    try {
      await supabase.from("ai_training_completions" as any).insert({
        user_id: user.id, task_key: task.key, reward_ksh: task.reward_ksh, payload: {},
      } as any);
      const newPoints = user.points + task.reward_ksh;
      await supabase.from("profiles").update({
        points: newPoints,
        lifetime_earned: Number(user.lifetime_earned ?? 0) + task.reward_ksh,
      } as any).eq("id", user.id);
      await supabase.from("points_transactions" as any).insert({
        user_id: user.id, delta: task.reward_ksh, reason: `AI Training: ${task.title}`,
      } as any);
      setUser({ ...user, points: newPoints });
      setCompleted(new Set([...completed, task.key]));
      toast.success(`Earned KSh ${task.reward_ksh.toLocaleString()}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not record task. Please try again.");
    } finally {
      setWorking(null);
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  return (
    <AppShell user={user}>
      <div className="px-5 pt-6 pb-10 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/app" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Premium earnings</p>
            <h1 className="text-xl font-bold text-gradient-gold flex items-center gap-2">
              <Brain className="size-5" /> AI Training Hub
            </h1>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 mb-5 border border-gold/30 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 size-32 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
          <p className="font-semibold">High-value training jobs</p>
          <p className="text-sm text-muted-foreground mt-1">
            Help build trustworthy AI systems by labelling images, sorting text, and verifying audio transcripts.
            Each completed task pays between KSh 1,000 and KSh 5,000.
          </p>
          {!unlocked && (
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="size-3.5" /> Locked — requires VIP {MIN_VIP}+ membership.
              </span>
              <Link to="/vip" className="h-10 px-4 rounded-xl bg-gradient-gold text-gold-foreground text-sm font-semibold flex items-center gap-1.5">
                <Crown className="size-4" /> Upgrade to unlock
              </Link>
            </div>
          )}
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-3">
          {TASKS.map((t) => {
            const done = completed.has(t.key);
            return (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 relative overflow-hidden"
              >
                <div className={!unlocked ? "blur-sm select-none pointer-events-none" : ""}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {t.kind === "image" ? <ImageIcon className="size-4 text-primary" /> :
                     t.kind === "text" ? <Type className="size-4 text-primary" /> :
                     <AudioLines className="size-4 text-primary" />}
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.kind}</p>
                  </div>
                  <p className="font-semibold text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  <p className="text-xs text-muted-foreground mt-2 italic">{t.example}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gradient-gold">{formatKsh(t.reward_ksh)}</span>
                    {done ? (
                      <span className="text-xs text-primary flex items-center gap-1"><CheckCircle2 className="size-4" /> Done</span>
                    ) : (
                      <button
                        disabled={!unlocked || !!working}
                        onClick={() => complete(t)}
                        className="h-9 px-3 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                      >
                        {working === t.key ? "Submitting..." : "Start task"}
                      </button>
                    )}
                  </div>
                </div>
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                    <div className="text-center">
                      <Lock className="size-6 text-gold mx-auto mb-1" />
                      <p className="text-xs font-semibold">Upgrade to access</p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
