import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Registration } from "@/components/Registration";
import { Dashboard } from "@/components/Dashboard";
import { getSessionId, loadProfile, markLogin, type Profile } from "@/lib/api";

export const Route = createFileRoute("/app")({
  component: AppEntry,
  head: () => ({ meta: [{ title: "Dashboard — LogiBack Earn" }] }),
});

function AppEntry() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  async function bootUser(p: Profile) {
    markLogin(p.id).catch(() => {});
    if (!p.interview_responses) {
      navigate({ to: "/onboarding" });
      return;
    }
    setUser(p);
  }

  useEffect(() => {
    (async () => {
      const id = getSessionId();
      if (id) {
        const p = await loadProfile(id);
        if (p) await bootUser(p);
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Registration onComplete={(u) => bootUser(u)} />;
  return <Dashboard user={user} setUser={setUser} onLogout={() => setUser(null)} />;
}
