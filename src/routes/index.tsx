import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, ShoppingBag, Star, Wallet, ShieldCheck, Sparkles, Plus, Minus,
  TrendingUp, Users, Coins, Quote,
} from "lucide-react";
import { InstallPrompt, useIsStandalone } from "@/components/InstallPrompt";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "LogiBack Earn — Get paid to review products in Kenya" },
      { name: "description", content: "Earn real KSh writing honest product reviews. Withdraw to M-Pesa from 1,000 points. Join 50,000+ Kenyans earning daily." },
      { property: "og:title", content: "LogiBack Earn — Get paid to review products" },
      { property: "og:description", content: "Earn real KSh writing honest product reviews. Withdraw to M-Pesa from 1,000 points." },
      { name: "theme-color", content: "#0a1f17" },
    ],
  }),
});

const STEPS = [
  { icon: ShoppingBag, title: "Pick a product", body: "Browse 50+ active jobs from Jumia, Kilimall, Amazon and more." },
  { icon: Star, title: "Write your review", body: "Visit the product page, leave a genuine review with a screenshot." },
  { icon: Wallet, title: "Withdraw to M-Pesa", body: "1 point = KSh 1. Cash out anytime from 1,000 points." },
];

const TESTIMONIALS = [
  { name: "Brian K.", city: "Nairobi", text: "I made KSh 18,400 in my first month. The app is so smooth.", earned: "KSh 18,400" },
  { name: "Aisha M.", city: "Mombasa", text: "Genuine platform. M-Pesa hits in minutes after approval.", earned: "KSh 32,100" },
  { name: "Dennis O.", city: "Kisumu", text: "I do reviews on matatu rides home. Honest extra income.", earned: "KSh 9,750" },
];

const FAQ = [
  { q: "Is this really free to join?", a: "Yes. Sign up with your phone and start earning on the Starter tier today." },
  { q: "How fast is M-Pesa withdrawal?", a: "Once a review is approved, you can withdraw instantly to your verified M-Pesa number. Most payouts arrive in under 10 minutes." },
  { q: "What stops people from copy-pasting reviews?", a: "Every review is quality-checked by our team. Spam or duplicate content is rejected and may suspend your account." },
  { q: "Do I need a smartphone?", a: "Yes. LogiBack Earn is a mobile-first PWA. Add it to your home screen for the best experience." },
  { q: "Can I refer friends?", a: "Absolutely. You get 500 points whenever a referred friend completes their first approved review." },
];

function Landing() {
  const navigate = useNavigate();
  const standalone = useIsStandalone();

  useEffect(() => {
    if (standalone) navigate({ to: "/app" });
  }, [standalone, navigate]);

  return (
    <div className="min-h-screen">
      <InstallPrompt />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LB</span>
            </div>
            <span className="font-bold">LogiBack Earn</span>
          </Link>
          <Link to="/app" className="h-10 px-5 rounded-full bg-gradient-gold text-gold-foreground text-sm font-bold flex items-center gap-2 shadow-gold">
            Get started <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-transparent" />
        <div className="absolute top-20 -left-20 size-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute top-40 -right-20 size-80 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 pt-12 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-semibold mb-6">
            <Sparkles className="size-3.5" /> Trusted by 50,000+ Kenyans
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold leading-tight max-w-3xl mx-auto">
            Get paid to review products.{" "}
            <span className="text-gradient-gold">From your phone.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of Kenyans earning real KSh writing honest product reviews. Withdraw straight to M-Pesa from 1,000 points.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/app" className="h-14 px-8 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-glow flex items-center justify-center gap-2 active:scale-[0.98] transition">
              Start earning today <ArrowRight className="size-5" />
            </Link>
            <a href="#how-it-works" className="h-14 px-8 rounded-2xl glass border border-border font-semibold flex items-center justify-center">
              How it works
            </a>
          </motion.div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto">
            <Stat icon={Users} label="Active reviewers" value="50K+" />
            <Stat icon={Star} label="Reviews submitted" value="50K+" />
            <Stat icon={Coins} label="Paid to workers" value="KSh 2.5M+" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">How it works</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Earn in three simple steps</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl p-6 relative">
              <div className="size-12 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center mb-4">
                <s.icon className="size-6 text-primary-foreground" />
              </div>
              <p className="text-xs text-gold font-bold tracking-wider">STEP {i + 1}</p>
              <h3 className="text-lg font-bold mt-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-b from-transparent via-primary/5 to-transparent py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Real stories</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Kenyans earning daily</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass rounded-3xl p-6">
                <Quote className="size-6 text-gold mb-3" />
                <p className="text-sm">{t.text}</p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                  <span className="text-xs font-bold text-gradient-gold">{t.earned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 py-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">FAQ</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Common questions</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <div className="glass rounded-3xl p-10 text-center relative overflow-hidden border border-gold/30">
          <div className="absolute -top-20 -right-20 size-60 rounded-full bg-gradient-gold opacity-30 blur-3xl" />
          <ShieldCheck className="size-12 mx-auto text-gold mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to start earning?</h2>
          <p className="mt-3 text-muted-foreground">It takes 30 seconds to sign up. Your first review pays today.</p>
          <Link to="/app" className="mt-6 inline-flex h-14 px-8 rounded-2xl bg-gradient-gold text-gold-foreground font-bold shadow-gold items-center gap-2">
            Create my account <TrendingUp className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LogiBack Earn. Get paid to review products.
      </footer>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-6 text-center">
      <Icon className="size-5 mx-auto text-gold mb-2" />
      <p className="text-2xl sm:text-3xl font-extrabold text-gradient-gold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="font-semibold text-sm">{q}</span>
        {open ? <Minus className="size-5 text-gold shrink-0" /> : <Plus className="size-5 text-gold shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 text-sm text-muted-foreground">{a}</div>}
    </div>
  );
}
