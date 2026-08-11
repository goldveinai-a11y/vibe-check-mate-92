import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAnonId } from "@/lib/anon-id";
import { trackEvent } from "@/lib/analytics";
import { SiteHeader } from "@/components/SiteHeader";

// Subscription checkout for the chat.
//
// The chat is the product now, so the thing being sold is access to it — not
// a report about one thread. But createCheckoutSession still wants an
// analysisId, because it was written when a purchase was always attached to
// one read. Rather than fork the billing code on the day of the pivot, this
// creates an empty analysis row to hang the subscription off. It costs one
// insert and keeps every downstream thing that already works — webhooks,
// the billing portal, the subscriptions table — working unchanged.

type Plan = "trial7" | "weekly";

export const Route = createFileRoute("/subscribe")({
  component: SubscribePage,
  head: () => ({
    meta: [{ title: "Unlock the chat - VibeCheck" }, { name: "robots", content: "noindex" }],
  }),
});

function SubscribePage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("plan") === "weekly" ? "weekly" : "trial7";
        const plan: Plan = requested as Plan;

        const { createAnalysis, createCheckoutSession } = await import("@/lib/vibecheck.functions");
        const anonId = getAnonId();

        const created = await createAnalysis({ data: { ownerAnonId: anonId } });
        if (!("id" in created)) throw new Error("could not start checkout");

        trackEvent("begin_checkout", { plan, surface: "chat_paywall" });

        const res = await createCheckoutSession({
          data: {
            analysisId: created.id,
            ownerAnonId: anonId,
            // trial7 rides the existing monthly price plus its one-euro trial
            // fee; weekly is the plain weekly price with its free days.
            plan: plan === "weekly" ? "weekly" : "monthly",
            environment: window.location.hostname === "vibecheckapp.app" ? "live" : "sandbox",
            // Both are required by the checkout schema. Success drops her back
            // into the chat unlocked; cancel drops her back into it unchanged,
            // in the same place she left off rather than on a dead page.
            returnUrl: window.location.origin + "/?paid=1#chat",
            cancelUrl: window.location.origin + "/?paywall=abandoned#chat",
          },
        });

        if (cancelled) return;
        if ("url" in res && res.url) {
          window.location.href = res.url;
          return;
        }
        throw new Error("error" in res ? res.error : "could not start checkout");
      } catch (e) {
        if (cancelled) return;
        trackEvent("checkout_error", {
          message: e instanceof Error ? e.message.slice(0, 120) : "unknown",
        });
        setError("We couldn't open the payment page. Nothing was charged.");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-10">
        <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-card p-7 text-center shadow-sm">
          {!error ? (
            <>
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-pink" />
              <h1 className="font-serif mt-5 text-2xl">Opening secure checkout</h1>
              <p className="mt-2 text-sm text-ink/60">Payment is handled by Stripe. One moment.</p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl">That didn't open</h1>
              <p className="mt-2 text-sm text-ink/70">{error}</p>
              <Link
                to="/"
                hash="chat"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-pink px-6 py-3 text-sm font-medium text-white"
              >
                Back to the chat
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
