import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/my-reports")({
  head: () => ({
    meta: [
      { title: "Find your reports — VibeCheck" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyReportsPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type State = "checking" | "form" | "sending" | "sent" | "error";

function MyReportsPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If there's already a valid session, skip straight to the account page —
  // no reason to make someone re-request a link they already used.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        navigate({ to: "/account" });
      } else {
        setState("form");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const emailValid = EMAIL_RE.test(email.trim());

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid) return;
    setState("sending");
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/account` : undefined,
      },
    });
    if (error) {
      setState("error");
      setErrorMsg(error.message);
      return;
    }
    setState("sent");
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />
      <section className="flex min-h-[70vh] items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-purple-soft">
              <Heart className="h-6 w-6 fill-pink text-pink" />
            </div>
            <h1 className="font-serif mt-5 text-3xl sm:text-4xl">Find your reports</h1>
            <p className="mt-3 text-sm text-ink/60">
              Bought a report on another device, or just cleared your browser? Enter the email you used at checkout — we'll send a link, no password needed.
            </p>
          </div>

          {state === "checking" && (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ink/40" />
            </div>
          )}

          {(state === "form" || state === "sending" || state === "error") && (
            <form onSubmit={sendLink} className="mt-8 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
              <label htmlFor="my-reports-email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-pink" />
                Email
              </label>
              <input
                id="my-reports-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-3 w-full rounded-full border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-pink"
              />
              {state === "error" && (
                <p className="mt-2 text-xs text-destructive">{errorMsg ?? "Something went wrong. Try again."}</p>
              )}
              <button
                type="submit"
                disabled={!emailValid || state === "sending"}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-pink px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
              >
                {state === "sending" ? "Sending…" : "Send me a login link"}
              </button>
            </form>
          )}

          {state === "sent" && (
            <div className="mt-8 rounded-3xl border border-mint/40 bg-mint-soft p-5 text-center shadow-sm sm:p-6">
              <p className="text-sm font-medium">Check your inbox</p>
              <p className="mt-2 text-xs text-ink/70">
                We sent a link to {email.trim()}. Tap it to see all your reports — on this device or any other.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
