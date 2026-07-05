import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — VibeCheck" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const disabled = !password || password !== confirm || password.length < 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-8">
        <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">Reset your password</h1>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium">New password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-pink"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-pink"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={disabled || submitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-pink px-6 py-3.5 text-base font-medium text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}