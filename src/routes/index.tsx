import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, ShoppingBag, Star, Wallet, ShieldCheck, Plus, Minus,
  TrendingUp, Users, Quote, Smartphone, Lock, MapPin, Mail, Clock,
} from "lucide-react";
import { InstallPrompt, useIsStandalone } from "@/components/InstallPrompt";
import { Logo } from "@/components/Logo";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "LogiBack International — Kenya Branch · Get paid to review" },
      { name: "description", content: "LogiBack International. London HQ, Kenya Branch. Get paid in real KSh to review products. Withdraw to M-Pesa instantly. Trusted by 50,000+ users worldwide." },
      { property: "og:title", content: "LogiBack International — Kenya Branch" },
      { property: "og:description", content: "Trusted by 50,000+ users worldwide. Earn KSh reviewing products." },
      { name: "theme-color", content: "#0a1f17" },
    ],
  }),
});

const STEPS = [
  { icon: ShoppingBag, title: "Pick a product", body: "Browse active jobs from popular Kenyan and global e-commerce platforms." },
  { icon: Star, title: "Write your review", body: "Search the product yourself and leave an honest review with a screenshot." },
  { icon: Wallet, title: "Withdraw to M-Pesa", body: "Get paid in real KSh. Cash out anytime from KSh 1,000." },
];

const TESTIMONIALS = [
  { name: "Brian K.", city: "Nairobi", text: "I earned KSh 18,400 in my first month. The app is straightforward to use.", earned: "KSh 18,400" },
  { name: "Aisha M.", city: "Mombasa", text: "Reliable platform. M-Pesa transfers arrive within minutes after approval.", earned: "KSh 32,100" },
  { name: "Dennis O.", city: "Kisumu", text: "I review products during my evening commute. Honest extra income.", earned: "KSh 9,750" },
];

const FAQ = [
  { q: "Is LogiBack Earn legit?", a: "Yes. LogiBack Earn pays verified reviewers in KSh via M-Pesa. Every payout is recorded and traceable. We do not ask for upfront fees on the free Starter tier." },
  { q: "Is it free to join?", a: "Yes. Registration is free. You can start earning on the Starter tier today with no payment required." },
  { q: "How fast is M-Pesa withdrawal?", a: "Once a review is approved, you can request a withdrawal to your verified M-Pesa number. Payouts are typically processed within a few minutes." },
  { q: "What stops people from copy-pasting reviews?", a: "Every review is quality-checked by our admin team. Spam or duplicate content is rejected and may result in account suspension." },
  { q: "Do I need a smartphone?", a: "Yes. LogiBack Earn is mobile-first. Add it to your home screen for the best experience." },
  { q: "Can I refer friends?", a: "Yes. You earn a referral bonus for each friend who completes their first approved review, up to your account referral limit." },
];

const TRUST = [
  { icon: () => <span className="text-base" aria-label="UK">🇬🇧</span>, label: "London HQ" },
  { icon: () => <span className="text-base" aria-label="Kenya">🇰🇪</span>, label: "Nairobi Branch" },
  { icon: Lock, label: "Secured connection" },
  { icon: Users, label: "50,000+ users worldwide" },
];

function Landing() {
  const navigate = useNavigate();
  const standalone = useIsStandalone();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (standalone) navigate({ to: "/app" });
  }, [standalone, navigate]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

      {/* HERO with background image */}
      <section className="relative overflow-hidden min-h-[78vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{
            backgroundImage: `url(${heroBg})`,
            transform: `translateY(${scrollY * 0.25}px) scale(1.1)`,
          }}
          aria-hidden
        />
        {/* Dark gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/65 to-background" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/40 sm:from-background/40" aria-hidden />

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-24 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-semibold mb-6">
            <ShieldCheck className="size-3.5" /> Kenya's trusted review platform
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold leading-tight max-w-3xl">
            Get paid to review products.{" "}
            <span className="text-gradient-gold">From your phone.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-foreground/90 max-w-xl">
            Earn real KSh writing honest product reviews. Withdraw straight to M-Pesa.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/app" className="h-14 px-8 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-glow flex items-center justify-center gap-2 active:scale-[0.98] transition">
              Start earning today <ArrowRight className="size-5" />
            </Link>
            <a href="#how-it-works" className="h-14 px-8 rounded-2xl glass border border-border font-semibold flex items-center justify-center">
              How it works
            </a>
          </motion.div>

          <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
            {TRUST.map((t) => (
              <div key={t.label} className="flex items-center gap-1.5 text-xs text-foreground/85">
                <t.icon className="size-4 text-gold" />
                <span className="font-semibold">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported platforms — generic, no fabricated partnerships */}
      <section className="border-y border-border/30 bg-background/60 py-8">
        <div className="max-w-6xl mx-auto px-5">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground text-center font-semibold">
            Reviews accepted from leading e-commerce platforms
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground/60">
            <span className="font-bold text-lg tracking-tight">Jumia</span>
            <span className="font-bold text-lg tracking-tight">Kilimall</span>
            <span className="font-bold text-lg tracking-tight">Amazon</span>
            <span className="font-bold text-lg tracking-tight">Jiji</span>
            <span className="font-bold text-lg tracking-tight">Masoko</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
            Brand names shown identify the platforms our reviewers cover. No partnership or endorsement is implied.
          </p>
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
          <p className="mt-3 text-muted-foreground">Sign up in 30 seconds. Your first review pays today.</p>
          <Link to="/app" className="mt-6 inline-flex h-14 px-8 rounded-2xl bg-gradient-gold text-gold-foreground font-bold shadow-gold items-center gap-2">
            Create my account <TrendingUp className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/40 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-5 grid sm:grid-cols-3 gap-8 text-sm">
          <div>
            <Logo size={36} />
            <p className="text-xs text-muted-foreground mt-3 max-w-xs">
              Kenya's trusted review platform. We pay verified reviewers in KSh via M-Pesa.
            </p>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Contact</p>
            <p className="flex items-center gap-2"><MapPin className="size-3.5 text-gold" /> Nairobi, Kenya</p>
            <p className="flex items-center gap-2"><Mail className="size-3.5 text-gold" /> support@logibackearn.app</p>
            <p className="flex items-center gap-2"><Clock className="size-3.5 text-gold" /> Support: Mon–Fri, 9am–5pm EAT</p>
          </div>
          <div className="space-y-2 text-xs">
            <p className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Legal</p>
            <Link to="/terms" className="block text-muted-foreground hover:text-foreground">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="block text-muted-foreground hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5 mt-8 pt-6 border-t border-border/30 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} LogiBack Earn. All rights reserved.
        </div>
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
