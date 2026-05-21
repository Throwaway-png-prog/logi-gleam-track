import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Registration } from "@/components/Registration";
import { Dashboard } from "@/components/Dashboard";
import { getSessionId, loadProfile, type Profile } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "LogiBack — Warehouse workflow tracking" },
      { name: "description", content: "Mobile-first warehouse workflow tracking. Scan units, earn points, climb tiers." },
      { name: "theme-color", content: "#0a1f17" },
    ],
  }),
});

function Index() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const id = getSessionId();
      if (id) setUser(await loadProfile(id));
      setLoaded(true);
    })();
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Registration onComplete={(u) => setUser(u)} />;
  return <Dashboard user={user} setUser={setUser} onLogout={() => setUser(null)} />;
}
