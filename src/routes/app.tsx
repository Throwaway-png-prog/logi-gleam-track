import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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

  useEffect(() => {
    (async () => {
      const id = getSessionId();
      if (id) {
        const p = await loadProfile(id);
        if (p) {
          setUser(p);
          markLogin(p.id).catch(() => {});
          if (typeof document !== "undefined" && p.theme_pref === "light") {
            document.documentElement.classList.add("light");
          }
        }
      }
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

  if (!user) return <Registration onComplete={(u) => { markLogin(u.id).catch(() => {}); setUser(u); }} />;
  return <Dashboard user={user} setUser={setUser} onLogout={() => setUser(null)} />;
}
