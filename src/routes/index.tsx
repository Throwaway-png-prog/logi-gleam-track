import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, ShoppingBag, Star, Wallet, ShieldCheck, Sparkles, Plus, Minus,
  TrendingUp, Users, Coins, Quote, Smartphone, Lock,
} from "lucide-react";
import { InstallPrompt, useIsStandalone } from "@/components/InstallPrompt";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "LogiBack Earn — Kenya's Trusted Review Platform" },
      { name: "description", content: "Get paid in real KSh to review products. Withdraw to M-Pesa instantly. Built in Kenya, trusted by thousands." },
      { property: "og:title", content: "LogiBack Earn — Kenya's Trusted Review Platform" },
      { property: "og:description", content: "Get paid in real KSh to review products. Withdraw to M-Pesa instantly." },
      { name: "theme-color", content: "#0a1f17" },
    ],
  }),
});

const STEPS = [
  { icon: ShoppingBag, title: "Pick a product", body: "Browse active jobs from Jumia, Kilimall, Amazon and more." },
  { icon: Star, title: "Write your review", body: "Search the product yourself, leave an honest review with a screenshot." },
  { icon: Wallet, title: "Withdraw to M-Pesa", body: "Get paid in real KSh. Cash out anytime from KSh 1,000." },
];

const TESTIMONIALS = [
  { name: "Brian K.", city: "Nairobi", text: "I made KSh 18,400 in my first month. The app is so smooth.", earned: "KSh 18,400" },
  { name: "Aisha M.", city: "Mombasa", text: "Genuine platform. M-Pesa hits in minutes after approval.", earned: "KSh 32,100" },
  { name: "Dennis O.", city: "Kisumu", text: "I do reviews on matatu rides home. Honest extra income.", earned: "KSh 9,750" },
];

const FAQ = [
  { q: "Is this really free to join?", a: "Yes. Sign up with your phone and start earning on the Starter tier today." },
  { q: "How fast is M-Pesa withdrawal?", a: "Once a review is approved, you can withdraw to your verified M-Pesa number. Most payouts arrive in under 10 minutes." },
  { q: "What stops people from copy-pasting reviews?", a: "Every review is quality-checked by our team. Spam or duplicate content is rejected and may suspend your account." },
  { q: "Do I need a smartphone?", a: "Yes. LogiBack Earn is a mobile-first app. Add it to your home screen for the best experience." },
  { q: "Can I refer friends?", a: "Yes. You earn KSh 100 whenever a referred friend completes their first approved review." },
];

const TRUST = [
  { icon: () => <span className="text-base">🇰🇪</span>, label: "Built in Kenya" },
  { icon: Lock, label: "SSL Secured" },
  { icon: Smartphone, label: "M-Pesa Payouts" },
  { icon: Users, label: "10,000+ Reviewers" },
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

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/"><Logo size={40} tagline /></Link>
          <Link to="/app" className="h-10 px-5 rounded-full bg-gradient-gold text-gold-foreground text-sm font-bold flex items-center gap-2 shadow-gold">
            Get started <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-transparent" />
        <div className="absolute top-20 -left-20 size-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute top-40 -right-20 size-80 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 pt-12 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-semibold mb-6">
            <Sparkles className="size-3.5" /> Kenya's trusted review platform
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold leading-tight max-w-3xl mx-auto">
            Get paid to review products.{" "}
            <span className="text-gradient-gold">From your phone.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Earn real KSh writing honest product reviews. Withdraw straight to M-Pesa.
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

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {TRUST.map((t) => (
              <div key={t.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <t.icon className="size-4 text-gold" />
                <span className="font-semibold">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className="max-w-3xl mx-auto px-5 py-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">FAQ</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Common questions</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>

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

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link>
          <span aria-hidden>·</span>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
        </div>
        <p>© {new Date().getFullYear()} LogiBack Earn. Kenya's Trusted Review Platform.</p>
      </footer>
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
