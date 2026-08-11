import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Lock } from "lucide-react";
import { getAnonId } from "@/lib/anon-id";
import { trackEvent } from "@/lib/analytics";
import { SiteHeader } from "@/components/SiteHeader";

// Subscription checkout for the chat.
//
// Two things are worth knowing about this file.
//
// One: createCheckoutSession still wants an analysisId, because it was
// written when a purchase was always attached to one report. Rather than
// fork the billing code on the day of the pivot, this creates an empty row
// to hang the subscription off — one insert, and every downstream thing
// that already works (webhooks, billing portal, subscriptions table) keeps
// working. It does leave junk in the analyses table; making analysisId
// optional is the real fix and is its own job.
//
// Two: the email step is not friction we could have skipped. Checkout
// requires an address, and asking here rather than inside Stripe means we
// still have it for the people who get as far as the card form and stop —
// which, on web, is most of them.

const PLANS = {
  trial7: { label: "7 days full access", price: "€1.00", after: "then €29.99/month" },
  weekly: { label: "3 days free", price: "€0.00", after: "then €9.99/week" },
} as const;

type PlanKey = keyof typeof PLANS;

export const Route = createFileRoute("/subscribe")({
  component: SubscribePage,
  head: () => ({
    meta: [{ title: "Unlock the chat - VibeCheck" }, { name: "robots", content: "noindex" }],
  }),
});

function SubscribePage() {
  const [plan, setPlan] = useState<PlanKey>("trial7");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plan");
    setPlan(p === "weekly" ? "weekly" : "trial7");
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const { createAnalysis, createCheckoutSession } = await import("@/lib/vibecheck.functions");
      const anonId = getAnonId();

      const created = await createAnalysis({ data: { ownerAnonId: anonId } });
      if (!("id" in created)) throw new Error("could not start checkout");

      trackEvent("begin_checkout", { plan, surface: "chat_paywall" });

      const res = await createCheckoutSession({
        data: {
          analysisId: created.id,
          ownerAnonId: anonId,
          email: email.trim(),
          plan: plan === "weekly" ? "weekly" : "monthly",
          environment: window.location.hostname === "vibecheckapp.app" ? "live" : "sandbox",
          returnUrl: window.location.origin + "/?paid=1#chat",
          cancelUrl: window.location.origin + "/?paywall=abandoned#chat",
        },
      });

      if ("url" in res && res.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error("error" in res ? res.error : "could not start checkout");
    } catch (err) {
      trackEvent("checkout_error", {
        message: err instanceof Error ? err.message.slice(0, 120) : "unknown",
      });
      setError("We couldn't open the payment page. Nothing was charged.");
      setBusy(false);
    }
  };

  const chosen = PLANS[plan];

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-8 pb-16">
        <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-2xl leading-snug">Unlock the chat</h1>

          <div className="mt-5 rounded-2xl border-2 border-pink/60 bg-pink-soft/25 px-4 py-3.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-medium">{chosen.label}</span>
              <span className="text-[15px] font-semibold">{chosen.price}</span>
            </div>
            <p className="mt-1 text-xs text-ink/55">{chosen.after}, cancel anytime</p>
          </div>

          <form onSubmit={onSubmit} className="mt-5">
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Where should we send your receipt?
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-pink focus:outline-none"
            />

            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-3.5 text-base font-medium text-white transition disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {busy ? "Opening checkout" : "Continue to payment"}
            </button>

            {error && (
              <p className="mt-3 text-sm text-destructive">
                {error}{" "}
                <Link to="/" hash="chat" className="underline underline-offset-2">
                  Back to the chat
                </Link>
              </p>
            )}
          </form>

          <p className="mt-4 text-center text-xs text-ink/45">
            Payment is handled by Stripe. We never see your card.
          </p>
        </div>
      </section>
    </main>
  );
}
