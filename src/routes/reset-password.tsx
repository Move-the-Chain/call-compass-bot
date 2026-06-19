import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Service Secure" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and emits PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/" }), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-brand)] text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-[22px] leading-none">Service Secure</div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Call Intelligence
            </div>
          </div>
        </div>

        <div className="surface-card p-7">
          <h1 className="font-display text-2xl">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready
              ? "Choose a new password for your account."
              : "Open this page from the reset link in your email."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">New password</div>
              <input type="password" className="modal-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" disabled={!ready} />
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Confirm password</div>
              <input type="password" className="modal-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" disabled={!ready} />
            </label>

            {error && (
              <div className="rounded-lg border border-neg/40 bg-neg/10 px-3 py-2 text-xs text-neg">{error}</div>
            )}
            {done && (
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs">Password updated. Redirecting…</div>
            )}

            <button
              type="submit"
              disabled={loading || !ready}
              className={cn(
                "mt-2 w-full rounded-lg bg-[image:var(--gradient-brand)] py-2.5 text-[13.5px] font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50",
              )}
            >
              {loading ? "Please wait…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
