import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, GraduationCap, Star, TrendingUp, Loader2, ChevronRight } from "lucide-react";
import { saveInterview, type InterviewResponses } from "@/lib/api";

const QUESTIONS = [
  {
    key: "why" as const, icon: Briefcase, label: "Why do you want to join LogiBack?",
    options: ["Earn extra income", "Work from home", "Full-time opportunity"],
  },
  {
    key: "country" as const, icon: MapPin, label: "Which country do you live in?",
    options: ["Kenya", "Uganda", "Tanzania", "Rwanda", "Nigeria", "South Africa", "Other"],
  },
  {
    key: "education" as const, icon: GraduationCap, label: "What is your highest education level?",
    options: ["Primary", "Secondary / KCSE", "Certificate / Diploma", "Bachelor's degree", "Master's degree or higher"],
  },
  {
    key: "experience" as const, icon: Star, label: "Do you have experience writing product reviews?",
    options: ["Yes, regularly", "Some experience", "No, this is new"],
  },
  {
    key: "expected" as const, icon: TrendingUp, label: "What do you expect to earn monthly?",
    options: ["KSh 5,000 – 10,000", "KSh 10,000 – 25,000", "KSh 25,000 – 50,000", "KSh 50,000+"],
  },
];

export function OnboardingInterview({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<InterviewResponses>>({ country: "Kenya" });
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const currentAnswer = answers[q.key];

  async function next() {
    if (!currentAnswer) return;
    if (!isLast) { setStep(step + 1); return; }
    setSaving(true);
    try {
      await saveInterview(userId, answers as InterviewResponses);
      onDone();
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-gradient-gold" : "bg-muted"}`} />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="glass rounded-3xl p-6 shadow-elegant"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Step {step + 1} of {QUESTIONS.length}</p>
          <div className="mt-3 flex items-start gap-3">
            <div className="size-11 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center shrink-0">
              <q.icon className="size-5 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold mt-1">{q.label}</h2>
          </div>

          <div className="mt-5 space-y-2">
            {q.options.map((opt) => {
              const active = currentAnswer === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [q.key]: opt })}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition active:scale-[0.99] ${
                    active
                      ? "border-gold bg-gold/10 text-foreground"
                      : "border-border bg-input/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-sm font-medium">{opt}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={next}
            disabled={!currentAnswer || saving}
            className="mt-6 w-full h-14 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-gold disabled:opacity-40 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="size-5 animate-spin" /> : (
              <>{isLast ? "Finish & enter dashboard" : "Next"} <ChevronRight className="size-5" /></>
            )}
          </button>
        </motion.div>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          Your answers help us match you with the best earning opportunities. Data is kept private.
        </p>
      </div>
    </div>
  );
}
