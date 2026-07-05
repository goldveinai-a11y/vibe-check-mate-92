import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VibeCheckout } from "@/components/VibeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getAnonId } from "@/lib/anon-id";

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

const PLANS: Array<{
  id: Plan;
  name: string;
  headline: string;
  price: string;
  sub: string;
  perks: string[];
  badge?: string;
  highlight?: boolean;
}> = [
  {
    id: "single",
    name: "Single Report",
    headline: "This chat only",
    price: "$4.99",
    sub: "one-time",
    perks: ["Full report for this conversation", "All red & green flags", "Psychological profile"],
  },
  {
    id: "monthly",
    name: "Premium Monthly",
    headline: "Unlimited chats",
    price: "3 days free",
    sub: "then $9.99/mo · cancel anytime",
    perks: ["Unlock this report instantly", "Unlimited new chat uploads", "Every red & green flag, every time", "Cancel before day 3, pay nothing"],
    badge: "MOST POPULAR",
    highlight: true,
  },
  {
    id: "yearly",
    name: "Premium Yearly",
    headline: "Best value",
    price: "$49.99",
    sub: "per year ($4.17/mo billed annually)",
    perks: ["Everything in Monthly", "Save 58% vs monthly", "1 full year of unlimited reports"],
  },
];

function PaywallPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Plan | null>(null);
  const ownerAnonId = typeof window !== "undefined" ? getAnonId() : "";
  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/checkout/return?id=${id}&session_id={CHECKOUT_SESSION_ID}`
    : "";

  return (
    <main className="min-h-screen bg-background pb-16">
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-md px-6 pt-6">
        <Link to="/results/$id" params={{ id }} className="text-sm text-muted-foreground">← Back to preview</Link>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <button
                onClick={() => setSelected(null)}
                className="mb-4 text-sm text-muted-foreground"
              >
                ← Change plan
              </button>
              <div className="rounded-3xl bg-card p-2 shadow-sm">
                <VibeCheckout
                  analysisId={id}
                  ownerAnonId={ownerAnonId}
                  plan={selected}
                  returnUrl={returnUrl}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="font-serif mt-4 text-4xl leading-tight">Unlock the full truth</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Attachment style, power dynamic, every red flag with the exact quote, and the future outlook.
              </p>

              <div className="mt-8 space-y-4">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`relative w-full rounded-3xl border p-5 text-left transition ${
                      p.highlight
                        ? "border-primary bg-card shadow-lg shadow-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-3 left-5 rounded-full bg-purple px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                        {p.badge}
                      </span>
                    )}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">{p.headline}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-3xl">{p.price}</div>
                        <p className="text-[11px] text-muted-foreground">{p.sub}</p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-1.5">
                      {p.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5 text-primary">✓</span>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Secure payment · Cancel anytime · Instant access
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}