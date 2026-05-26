import { Ban } from "lucide-react";
import { setSessionId } from "@/lib/api";

export function BlockedScreen({ reason, onSignOut }: { reason?: string | null; onSignOut: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-sm w-full glass rounded-3xl p-8 text-center border border-destructive/40">
        <div className="size-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto">
          <Ban className="size-8 text-destructive" />
        </div>
        <h1 className="mt-5 text-xl font-bold">Account suspended</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Your account has been suspended. Please contact support for assistance.
        </p>
        {reason && (
          <p className="text-xs text-muted-foreground mt-3 italic">Reason: {reason}</p>
        )}
        <button
          onClick={() => { setSessionId(null); onSignOut(); }}
          className="mt-6 w-full h-12 rounded-xl glass text-sm font-semibold"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
