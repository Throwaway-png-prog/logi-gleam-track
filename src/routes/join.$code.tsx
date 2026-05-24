import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { setPendingReferral } from "@/lib/api";

export const Route = createFileRoute("/join/$code")({
  component: JoinPage,
  head: () => ({ meta: [{ title: "Join LogiBack Earn" }, { name: "robots", content: "noindex" }] }),
});

function JoinPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setPendingReferral(code);
    navigate({ to: "/app" });
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Applying referral and opening the app…</p>
    </div>
  );
}
