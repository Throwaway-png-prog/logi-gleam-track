import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Conditions — LogiBack Earn" },
      { name: "description", content: "Terms and conditions for using LogiBack Earn." },
    ],
  }),
});

function TermsPage() {
  return (
    <div className="min-h-screen px-5 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="size-11 rounded-xl glass flex items-center justify-center"><ArrowLeft className="size-5" /></Link>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Legal</p>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="size-6 text-gold" /> Terms & Conditions</h1>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8 space-y-5 text-sm leading-relaxed">
        <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>

        <Section title="1. Acceptance of terms">
          By creating an account on LogiBack Earn ("the Platform"), you agree to be legally bound by these Terms & Conditions and our Privacy Policy. If you do not agree, do not use the Platform.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 18 years old and a resident of a supported country (Kenya by default) to use LogiBack Earn. You must provide accurate, current information during registration.
        </Section>

        <Section title="3. Account responsibility">
          You are responsible for safeguarding your 4-digit PIN. Never share your PIN with anyone, including LogiBack staff. LogiBack will never ask for your PIN by phone, email, or SMS.
        </Section>

        <Section title="4. Earning model">
          LogiBack Earn pays workers in Kenya Shillings (KSh) for completing genuine product reviews. Each tier (Starter, Basic, Pro, Expert) has a daily job limit and per-job rate. All earnings are paid out via M-Pesa subject to a minimum withdrawal of KSh 1,000.
        </Section>

        <Section title="5. Quality standards & rejection">
          All reviews are quality-checked. Copy-pasted, AI-generated, spam, or fake content will be rejected. Repeated low-quality submissions may result in suspension and forfeiture of any pending earnings.
        </Section>

        <Section title="6. Tier upgrades">
          Each tier requires completing all jobs in the current tier and paying the upgrade fee. Fees are non-refundable once the upgrade is approved.
        </Section>

        <Section title="7. Referrals">
          You earn KSh 100 when a friend you referred completes their first approved review. The referred user receives a KSh 50 welcome bonus. Self-referrals and fake accounts are forfeit.
        </Section>

        <Section title="8. Prohibited conduct">
          You may not (a) create multiple accounts, (b) automate submissions, (c) impersonate others, (d) attempt to defraud the Platform or its supervisors, or (e) use the Platform for any illegal activity.
        </Section>

        <Section title="9. Termination">
          We may suspend or terminate your account at any time if we suspect fraud, abuse, or violation of these Terms. Earnings in suspended accounts may be withheld pending investigation.
        </Section>

        <Section title="10. Limitation of liability">
          LogiBack Earn is provided "as is". We are not liable for indirect, incidental, or consequential damages arising from your use of the Platform.
        </Section>

        <Section title="11. Changes to terms">
          We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
        </Section>

        <Section title="12. Contact">
          Questions? Reach support through the in-app messages or your supervisor.
        </Section>
      </div>

      <div className="mt-6 text-center">
        <Link to="/privacy" className="text-sm text-gold hover:underline">Read our Privacy Policy →</Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bold text-base mb-1.5">{title}</h2>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
