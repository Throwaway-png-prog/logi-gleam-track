import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { OnboardingInterview } from "@/components/OnboardingInterview";
import { getSessionId, loadProfile, type Profile } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Welcome — LogiBack Earn" }] }),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { navigate({ to: "/app" }); return; }
    loadProfile(sid).then((u) => {
      if (!u) { navigate({ to: "/app" }); return; }
      if (u.interview_responses) { navigate({ to: "/app" }); return; }
      setUser(u);
    });
  }, [navigate]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  return <OnboardingInterview userId={user.id} onDone={() => navigate({ to: "/app" })} />;
}
