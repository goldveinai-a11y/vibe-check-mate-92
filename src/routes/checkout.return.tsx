import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle2, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({ meta: [{ title: "Payment complete — VibeCheck" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  component: ReturnPage,
});

type LinkState = "idle" | "sending" | "sent" | "error";

function ReturnPage() {
  const { id, email } = Route.useSearch();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkState, setLinkState] = useState<LinkState>("idle");

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, [id]);

  // Automatically send a magic link to the email captured at checkout —
  // this is the account: no password, no separate "save my report" form to
  // forget to fill in. One email gets them a login that finds this report
  // (and every future one) from any device.
  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    setLinkState("sending");
    supabase.auth
      .signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/account` : undefined,
        },
      })
      .then(({ error }) => {
        if (cancelled) return;
        setLinkState(error ? "error" : "sent");
      })
      .catch(() => {
        if (!cancelled) setLinkState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">Payment received</h1>
          <p className="mt-2 text-sm text-ink/60">Missing report reference.</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-white">Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />
      <section className="flex min-h-[70vh] items-center justify-center px-5 py-16">
        <div className="w-full max-w-md text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-pink text-white shadow-md"
          >
            <Heart className="h-7 w-7 fill-white" />
          </motion.div>
          <h1 className="font-serif text-3xl sm:text-4xl">
            {ready ? "Your report is ready" : "Finalizing your report…"}
          </h1>
          <p className="mt-3 text-sm text-ink/60">
            {ready ? "Tap below to read the full compatibility breakdown." : "Just a moment while we unlock your premium insights."}
          </p>

          <div className="mt-6 flex justify-center">
            {ready ? (
              <CheckCircle2 className="h-6 w-6 text-mint" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-pink" />
            )}
          </div>

          <button
            onClick={() => navigate({ to: "/report/$id", params: { id } })}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
          >
            View Full Report
          </button>

          {email && (
            <div className="mt-8 rounded-3xl border border-border/60 bg-card p-5 text-left shadow-sm">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-pink" />
                Access saved to {email}
              </p>
              <p className="mt-1 text-xs text-ink/60">
                {linkState === "sending" && "Sending your magic link…"}
                {linkState === "sent" && "Check your inbox — tap the link any time to see this report (and any future ones) from any device, no password needed."}
                {linkState === "error" && "Payment went through, but we couldn't send the login link right now. Your report is still safe — visit /my-reports later to request a new one."}
                {linkState === "idle" && "Preparing your login link…"}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}