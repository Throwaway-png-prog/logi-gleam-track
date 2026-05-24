import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — LogiBack Earn" },
      { name: "description", content: "How LogiBack Earn collects, uses, and protects your data." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <div className="min-h-screen px-5 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Legal</p>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Lock className="size-6 text-gold" /> Privacy Policy</h1>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8 space-y-5 text-sm leading-relaxed">
        <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>

        <p>Your privacy matters. This policy explains what we collect, how we use it, and your rights.</p>

        <Section title="1. Data we collect">
          <ul className="list-disc list-inside space-y-1">
            <li>Phone number (for sign-in and M-Pesa payouts)</li>
            <li>Full name and display name (for your profile and the leaderboard)</li>
            <li>Encrypted PIN (we never store it in plain text)</li>
            <li>Review submissions, screenshots, ratings, and timestamps</li>
            <li>Onboarding interview responses (helps us match you with jobs)</li>
            <li>M-Pesa number (only when you choose to verify it)</li>
            <li>Device information (browser, OS, IP) for fraud prevention</li>
          </ul>
        </Section>

        <Section title="2. How we use your data">
          <ul className="list-disc list-inside space-y-1">
            <li>Operate the Platform: process reviews, calculate earnings, pay you</li>
            <li>Verify your identity and prevent fraud</li>
            <li>Send service notifications (review approvals, payouts, alerts)</li>
            <li>Improve our product through aggregated, anonymized analytics</li>
          </ul>
        </Section>

        <Section title="3. Sharing">
          We do not sell your data. We share only with: (a) M-Pesa / Safaricom to process payouts; (b) law enforcement when legally required; (c) trusted service providers under strict confidentiality.
        </Section>

        <Section title="4. Security">
          All data is encrypted in transit (HTTPS) and stored on secure servers. Your PIN is hashed. You alone control your account credentials.
        </Section>

        <Section title="5. Your rights">
          You can request a copy of your data, correction of inaccuracies, or deletion of your account at any time by contacting support in-app.
        </Section>

        <Section title="6. Cookies & local storage">
          We use local storage to keep you signed in and remember preferences (theme, dismissed banners). We do not use third-party advertising cookies.
        </Section>

        <Section title="7. Children's privacy">
          LogiBack Earn is not intended for users under 18. We do not knowingly collect data from minors.
        </Section>

        <Section title="8. Changes">
          We may update this policy. We will notify you in-app of material changes.
        </Section>

        <Section title="9. Contact">
          For privacy questions, reach support through the in-app messages.
        </Section>
      </div>

      <div className="mt-6 text-center">
        <Link to="/terms" className="text-sm text-gold hover:underline">Read our Terms & Conditions →</Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bold text-base mb-1.5">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
