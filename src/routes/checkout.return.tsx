import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle2, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { establishCheckoutSession } from "@/lib/vibecheck.functions";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({ meta: [{ title: "Payment complete - VibeCheck" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
    plan: typeof s.plan === "string" ? s.plan : undefined,
    value: typeof s.value === "string" ? Number(s.value) : undefined,
    currency: typeof s.currency === "string" ? s.currency : undefined,
  }),
  component: ReturnPage,
});

type LinkState = "idle" | "sending" | "sent" | "error";
type SessionState = "idle" | "checking" | "logged_in" | "failed";

function emailBannerMessage(sessionState: SessionState, linkState: LinkState): string {
  if (sessionState === "logged_in") {
    return "You're already logged in on this device - see this report (and any future ones) anytime from your account.";
  }
  if (linkState === "sending") return "Sending your magic link...";
  if (linkState === "sent") {
    return "Check your inbox - tap the link any time to see this report (and any future ones) from any device, no password needed.";
  }
  if (linkState === "error") {
    return "Payment went through, but we couldn't send the login link right now. Your report is still safe - visit /my-reports later to request a new one.";
  }
  return "Preparing your login link...";
}

function ReturnPage() {
  const { id, email, session_id: sessionId, plan, value, currency } = Route.useSearch();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, [id]);

  // Automatically send a magic link to the email captured at checkout -
  // this is the account: no password, no separate "save my report" form to
  // forget to fill in. One email gets them a login that finds this report
  // (and every future one) from any device. Kept as-is even though the
  // effect below tries to log this same tab in immediately - this email is
  // still the only way back in from a different device later.
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

  // Auto-login: establish a real Supabase session in THIS tab right after
  // checkout, so the buyer lands on /account already signed in instead of
  // having to open their email and click a magic link first. Retries a
  // few times with a short delay because the Stripe webhook that flips
  // `paid` to true can land a moment after this page's own redirect - if
  // it never succeeds we just quietly fall back to the emailed link above
  // (no error shown to the user, since that path still works).
  useEffect(() => {
    if (!id || !sessionId) return;
    let cancelled = false;
    let attempt = 0;

    async function tryEstablish() {
      if (cancelled) return;
      attempt += 1;
      setSessionState("checking");
      const result = await establishCheckoutSession({ data: { id: id as string, sessionId: sessionId as string } });
      if (cancelled) return;
      if ("error" in result) {
        if (attempt < 5) {
          setTimeout(tryEstablish, 1500);
        } else {
          setSessionState("failed");
        }
        return;
      }
      const { error } = await supabase.auth.verifyOtp({ token_hash: result.tokenHash, type: "magiclink" });
      if (cancelled) return;
      setSessionState(error ? "failed" : "logged_in");
      if (!error && !purchaseTrackedRef.current) {
        purchaseTrackedRef.current = true;
        trackEvent("purchase_completed", {
          report_id: id,
          value: value ?? 0,
          currency: currency ?? "USD",
          transaction_id: sessionId,
          plan,
        });
        trackEvent("signup_completed", { report_id: id, signup_method: "magic_link_post_purchase" });
      }
    }

    tryEstablish();
    return () => {
      cancelled = true;
    };
  }, [id, sessionId, value, currency, plan]);

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
            {ready ? "Your report is ready" : "Finalizing your report..."}
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
              <p className="mt-1 text-xs text-ink/60">{emailBannerMessage(sessionState, linkState)}</p>
              {sessionState === "logged_in" && (
                <Link to="/account" className="mt-3 inline-block text-xs font-medium text-pink underline">
                  View all your reports -&gt;
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
