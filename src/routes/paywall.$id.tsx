import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, PieChart, Flag, MessageCircle, Bell, Mail, Lock, Gift, Loader2, Check, X } from "lucide-react";
import { createCheckoutSession, getUnlockedCount } from "@/lib/vibecheck.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getAnonId, getStoredRefCode } from "@/lib/anon-id";
import { SiteHeader } from "@/components/SiteHeader";
import { trackEvent } from "@/lib/analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same live count backing the "reports unlocked" counter on the free
// /results/$id preview page (see getUnlockedCount - real paid-analyses
// count + a baseline floor). This page previously showed a separate,
// hand-typed "1,217 chats analyzed" number that could never match and
// would go stale the moment it was written. Sharing the same query means
// both pages always show the identical, real, live number.
const unlockedCountQuery = queryOptions({
  queryKey: ["unlocked-count"],
  queryFn: () => getUnlockedCount(),
  staleTime: 60_000,
});

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
  { Icon: MessageCircle, title: "Conversation Tone Summary", body: "Understand the overall mood - from Warm & Flirty to Playful & Engaging or Distant & Cold." },
  { Icon: Bell, title: "Future Outlook", body: "A forward-looking read on where this connection could be heading, plus a personal recommendation." },
];

type Tier = {
  id: Plan;
  name: string;
  price: string;
  cents: string;
  priceValue: number;
  sub: string;
  cta: string;
  badge?: string;
  annualNote?: string;
  savingsBadge?: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "single",
    name: "Single Report",
    price: "$4",
    cents: ".99",
    priceValue: 4.99,
    sub: "One-time deep analysis of this single chat, plus 10 AI chat questions about your results. No subscription, no future access.",
    cta: "Get Only This Report - $4.99",
  },
  {
    id: "monthly",
    name: "Premium Monthly",
    price: "$4",
    cents: ".99",
    priceValue: 4.99,
    sub: "Get this report instantly + unlock 3 days of Unlimited Chat Uploads and unlimited AI chat about your results. Renews at $9.99/mo. Cancel anytime.",
    cta: "Get Report + Free Trial - $4.99",
    badge: "MOST POPULAR",
    highlight: true,
  },
  {
    id: "yearly",
    name: "Premium Yearly",
    price: "$39",
    cents: ".99",
    priceValue: 39.99,
    sub: "Full access to all features for 12 months, including unlimited AI chat about your results. Best value.",
    cta: "Get Annual Access - $39.99",
    annualNote: "$3.33 / mo (billed annually)",
    savingsBadge: "SAVE 67%",
  },
];

function PaywallPage() {
  const { id } = Route.useParams();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const ownerAnonId = typeof window !== "undefined" ? getAnonId() : "";
  const refCode = typeof window !== "undefined" ? getStoredRefCode() : null;
  const emailValid = EMAIL_RE.test(email.trim());
  const { data: unlocked } = useQuery(unlockedCountQuery);

  useEffect(() => {
    trackEvent("paywall_viewed", { report_id: id, paywall_variant: "default" });
  }, [id]);

  const handlePickPlan = async (planId: Plan) => {
    if (!emailValid) {
      setEmailTouched(true);
      if (typeof document !== "undefined") {
        document.getElementById("vibecheck-email-input")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (loadingPlan) return;
    setCheckoutError(null);
    setLoadingPlan(planId);
    const tier = TIERS.find((t) => t.id === planId)!;
    trackEvent("checkout_started", { report_id: id, value: tier.priceValue, currency: "USD", plan: planId });
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/checkout/return?id=${id}&session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email.trim())}&plan=${planId}&value=${tier.priceValue}&currency=USD`;
      const cancelUrl = `${origin}/paywall/${id}`;
      const result = await createCheckoutSession({
        data: {
          analysisId: id,
          ownerAnonId,
          plan: planId,
          environment: getStripeEnvironment(),
          returnUrl: successUrl,
          cancelUrl,
          email: email.trim(),
          ...(refCode ? { refCode } : {}),
        },
      });
      if ("error" in result) throw new Error(result.error);
      window.location.href = result.url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-cream pb-20 text-ink">
      <PaymentTestModeBanner />
      <SiteHeader unlockHref="/paywall/$id" unlockParams={{ id }} />

      <motion.section key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-4">
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
              You've seen the surface. Go deeper with a detailed, AI-powered breakdown of everything happening between the lines of your conversation - so you can stop wondering and know where you actually stand.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-ink/60">
              <Lock className="h-4 w-4 text-mint" />
              No receipts kept - read once, deleted for good.
            </div>
            {unlocked && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-pink/40 bg-pink-soft px-4 py-2 text-xs font-medium text-pink sm:text-sm">
                <Lock className="h-3.5 w-3.5" />
                {unlocked.count.toLocaleString("en-US")} reports unlocked
              </div>
            )}
            {refCode && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint-soft/60 px-4 py-2 text-sm text-ink/80">
                <Gift className="h-4 w-4 shrink-0 text-mint" />
                Referral code applied - 20% off if it checks out.
              </div>
            )}
          </div>

          {/* Without/With comparison - the same proven contrast pattern
              competitors use on their paywalls, rewritten in VibeCheck's
              own voice around what the report actually contains
              (Compatibility Radar, quoted flags, real trend tracking)
              instead of generic pain points. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">Without VibeCheck</p>
              <ul className="mt-4 space-y-3 text-sm text-ink/70">
                <li className="flex gap-2.5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/30" />
                  Re-reading the same texts trying to decode what they meant
                </li>
                <li className="flex gap-2.5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/30" />
                  Guessing whether it's a red flag or you're overthinking
                </li>
                <li className="flex gap-2.5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/30" />
                  Asking friends who just tell you what you want to hear
                </li>
                <li className="flex gap-2.5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/30" />
                  No idea if the vibe is actually fading, or you're imagining it
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-pink/30 bg-pink-soft p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-pink">With VibeCheck</p>
              <ul className="mt-4 space-y-3 text-sm text-ink/80">
                <li className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
                  Every message scored across 7 chemistry dimensions
                </li>
                <li className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
                  Red flags backed by the exact quote, not a hunch
                </li>
                <li className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
                  An unbiased AI read, not a friend managing your feelings
                </li>
                <li className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
                  Real trend tracking - see if it's cooling, don't just guess
                </li>
              </ul>
            </div>
          </div>

          {/* Proof points instead of testimonials - we don't have real
              user quotes to show yet, and inventing named reviews would be
              fake social proof. These are either live data (same query
              backing the badge above) or true static facts about what
              every report contains. */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm">
              <p className="font-serif text-2xl text-ink sm:text-3xl">{unlocked ? unlocked.count.toLocaleString("en-US") : "—"}</p>
              <p className="mt-1 text-[11px] leading-tight text-ink/60">Reports unlocked</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm">
              <p className="font-serif text-2xl text-ink sm:text-3xl">7</p>
              <p className="mt-1 text-[11px] leading-tight text-ink/60">Chemistry axes scored</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm">
              <p className="font-serif text-2xl text-ink sm:text-3xl">100%</p>
              <p className="mt-1 text-[11px] leading-tight text-ink/60">From your actual chat</p>
            </div>
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
              {/* AI-chat teaser, with the Rizz-differentiation angle folded
                  into the subtext (no new element added) - the heading
                  leads with "AI chat" so the feature itself stays legible
                  (this is a chat you can ask things in), then the subtext
                  covers both use cases: general Q&A about the report (the
                  original framing) and reply-help grounded in the exact
                  conversation, which directly answers the most common
                  negative-review complaint about reply-gen competitors:
                  generic, repetitive, same-for-everyone lines. */}
              <div className="mt-4 rounded-3xl bg-ink p-5 text-cream sm:p-6">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-pink" />
                  <p className="text-sm font-medium">Plus: an AI chat that actually knows your conversation</p>
                </div>
                <p className="mt-1.5 text-xs text-cream/70">
                  Ask anything about your results, or get reply help grounded in this exact chat - not a database of pickup lines. 10 free questions with any report, unlimited with Premium.
                </p>
              </div>
            </div>

            {/* Tiers */}
            <div className="space-y-5">
              <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <label htmlFor="vibecheck-email-input" className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Mail className="h-4 w-4 text-pink" />
                  Your email
                </label>
                <p className="mt-1 text-xs text-ink/60">
                  So you can find this report again from any device - we'll send a magic link, no password needed.
                </p>
                <input
                  id="vibecheck-email-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@example.com"
                  className={`mt-3 w-full rounded-full border bg-cream px-4 py-3 text-sm outline-none transition focus:border-pink ${
                    emailTouched && !emailValid ? "border-destructive" : "border-border"
                  }`}
                />
                {emailTouched && !emailValid && (
                  <p className="mt-2 text-xs text-destructive">Enter a valid email to continue.</p>
                )}
              </div>

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
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-xl">{t.name}</h3>
                    {t.savingsBadge && (
                      <span className="rounded-full bg-mint-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink/80">
                        {t.savingsBadge}
                      </span>
                    )}
                  </div>
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
                  {t.id === "yearly" && (
                    <p className="mt-2 text-xs text-ink/50">vs $9.99/mo monthly ($119.88/yr)</p>
                  )}
                  <button
                    onClick={() => handlePickPlan(t.id)}
                    disabled={loadingPlan !== null}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                  >
                    {loadingPlan === t.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting to secure checkout...
                      </>
                    ) : (
                      t.cta
                    )}
                  </button>
                </div>
              ))}
              {checkoutError && (
                <p className="text-center text-xs text-destructive">{checkoutError}</p>
              )}
              <p className="text-center text-xs text-ink/60">
                Apple Pay - Google Pay - Card - Link - secure checkout by Stripe
              </p>
              <Link
                to="/results/$id"
                params={{ id }}
                className="block text-center text-xs text-ink/50 hover:text-ink"
              >
                &lt;- Back to preview
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
