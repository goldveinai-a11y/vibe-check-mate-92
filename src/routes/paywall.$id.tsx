import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, PieChart, Flag, MessageCircle, Bell } from "lucide-react";
import { VibeCheckout } from "@/components/VibeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getAnonId } from "@/lib/anon-id";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/paywall/$id")({
  head: () => ({
    meta: [
      { title: "Unlock your full VibeCheck" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaywallPage,
});

type Plan = "single" | "monthly" | "yearly";

const FEATURES: Array<{ Icon: typeof PieChart; title: string; body: string }> = [
  { Icon: PieChart, title: "Compatibility Breakdown", body: "A category-by-category look at emotional, playful, and communication chemistry with clear scores." },
  { Icon: Flag, title: "Red & Green Flag Analysis", body: "Spot the encouraging signs and the subtle warning signals hidden in your chat." },
  { Icon: MessageCircle, title: "Conversation Tone Summary", body: "Understand the overall mood — from Warm & Flirty to Playful & Engaging or Distant & Cold." },
  { Icon: Bell, title: "Future Outlook", body: "A forward-looking read on where this connection could be heading, plus a personal recommendation." },
];

type Tier = {
  id: Plan;
  name: string;
  price: string;
  cents: string;
  sub: string;
  cta: string;
  badge?: string;
  annualNote?: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "single",
    name: "Single Report",
    price: "$4",
    cents: ".99",
    sub: "One-time deep analysis of this single chat. No subscription, no future access.",
    cta: "Get Only This Report — $4.99",
  },
  {
    id: "monthly",
    name: "Premium Monthly",
    price: "$4",
    cents: ".99",
    sub: "Get this report instantly + unlock 3 days of Unlimited Chat Uploads. Renews at $9.99/mo. Cancel anytime.",
    cta: "Get Report + Free Trial — $4.99",
    badge: "MOST POPULAR",
    highlight: true,
  },
  {
    id: "yearly",
    name: "Premium Yearly",
    price: "$49",
    cents: ".99",
    sub: "Full access to all features for 12 months. Best value.",
    cta: "Get Annual Access — $49.99",
    annualNote: "$4.17 / mo (billed annually)",
  },
];

function PaywallPage() {
  const { id } = Route.useParams();
  const [selected, setSelected] = useState<Plan | null>(null);
  const ownerAnonId = typeof window !== "undefined" ? getAnonId() : "";
  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/checkout/return?id=${id}&session_id={CHECKOUT_SESSION_ID}`
    : "";

  return (
    <main className="min-h-screen bg-cream pb-20 text-ink">
      <PaymentTestModeBanner />
      <SiteHeader unlockHref="/paywall/$id" unlockParams={{ id }} />

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.section
            key="checkout"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-5 pt-4"
          >
            <div className="mx-auto max-w-2xl">
              <button onClick={() => setSelected(null)} className="text-sm text-ink/60 hover:text-ink">
                ← Change plan
              </button>
              <div className="mt-4 rounded-3xl border border-border/60 bg-card p-2 shadow-sm">
                <VibeCheckout analysisId={id} ownerAnonId={ownerAnonId} plan={selected} returnUrl={returnUrl} />
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pt-4">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col items-center text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Premium Report
                </span>
                <h1 className="font-serif mt-6 text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
                  Unlock the full story of your vibe
                </h1>
                <p className="mt-4 max-w-2xl text-base text-ink/70">
                  You've seen the surface. Go deeper with a detailed, AI-powered breakdown of everything happening between the lines of your conversation.
                </p>
              </div>

              <div className="mt-12 grid gap-8 lg:grid-cols-2">
                {/* Features */}
                <div>
                  <h2 className="font-serif text-lg">What's inside your full report</h2>
                  <div className="mt-4 space-y-4">
                    {FEATURES.map((f) => (
                      <div key={f.title} className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink-soft text-pink">
                          <f.Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-serif mt-4 text-xl">{f.title}</h3>
                        <p className="mt-2 text-sm text-ink/70">{f.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tiers */}
                <div className="space-y-5">
                  {TIERS.map((t) => (
                    <div
                      key={t.id}
                      className={`relative rounded-3xl border bg-card p-5 shadow-sm sm:p-6 ${
                        t.highlight ? "border-pink shadow-md shadow-pink/10" : "border-border/60"
                      }`}
                    >
                      {t.badge && (
                        <div className="mb-3 flex justify-center">
                          <span className="rounded-full bg-pink-soft px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-pink">
                            {t.badge}
                          </span>
                        </div>
                      )}
                      <h3 className="font-serif text-xl">{t.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className={`font-serif text-4xl ${t.highlight ? "text-pink" : "text-ink"}`}>{t.price}</span>
                        <span className={`font-serif text-2xl ${t.highlight ? "text-pink" : "text-ink"}`}>{t.cents}</span>
                      </div>
                      <p className="mt-3 text-sm text-ink/70">{t.sub}</p>
                      {t.annualNote && (
                        <span className="mt-3 inline-block rounded-full bg-mint-soft px-3 py-1 text-xs text-ink/80">
                          {t.annualNote}
                        </span>
                      )}
                      <button
                        onClick={() => setSelected(t.id)}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-pink px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                      >
                        {t.cta}
                      </button>
                    </div>
                  ))}
                  <p className="text-center text-xs text-ink/60">
                    Secure payment · Cancel anytime · Instant access
                  </p>
                  <Link to="/results/$id" params={{ id }} className="block text-center text-xs text-ink/50 hover:text-ink">
                    ← Back to preview
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}