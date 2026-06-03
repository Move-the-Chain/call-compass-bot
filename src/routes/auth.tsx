import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Service Secure" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
          <h1 className="font-display text-2xl">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in with your work email."
              : "Sign up to set up your team. The first account becomes admin."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <label className="block">
                <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Name</div>
                <input className="modal-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            )}
            <label className="block">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Email</div>
              <input type="email" className="modal-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Password</div>
              <input type="password" className="modal-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </label>

            {error && (
              <div className="rounded-lg border border-neg/40 bg-neg/10 px-3 py-2 text-xs text-neg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "mt-2 w-full rounded-lg bg-[image:var(--gradient-brand)] py-2.5 text-[13.5px] font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50",
              )}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <button onClick={() => setMode("signup")} className="hover:text-foreground">
                First time here? <span className="text-primary underline-offset-4 hover:underline">Create the first admin account</span>
              </button>
            ) : (
              <button onClick={() => setMode("signin")} className="hover:text-foreground">
                Already have an account? <span className="text-primary underline-offset-4 hover:underline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
