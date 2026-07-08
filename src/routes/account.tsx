import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2, LogOut, CreditCard, Sparkles, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyReports, createBillingPortalSession, type MyReportsResult } from "@/lib/vibecheck.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your reports — VibeCheck" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type LoadState = "checking" | "loading" | "ready" | "signed-out" | "error";

function AccountPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>("checking");
  const [data, setData] = useState<MyReportsResult | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!sessionData.session) {
        setState("signed-out");
        return;
      }
      setState("loading");
      try {
        const result = await getMyReports();
        if (cancelled) return;
        setData(result);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const result = await createBillingPortalSession({
        data: {
          returnUrl: typeof window !== "undefined" ? window.location.href : "",
          environment: getStripeEnvironment(),
        },
      });
      if ("url" in result) {
        window.location.href = result.url;
        return;
      }
      alert(result.error);
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (state === "checking" || state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-ink/40" />
      </main>
    );
  }

  if (state === "signed-out") {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader showUnlock={false} />
        <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-3xl">You're not logged in</h1>
          <p className="mt-2 text-sm text-ink/60">Request a login link to see your reports.</p>
          <Link to="/my-reports" className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-sm font-medium text-white shadow-sm">
            Find my reports
          </Link>
        </section>
      </main>
    );
  }

  if (state === "error" || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">Couldn't load your reports</h1>
          <p className="mt-2 text-sm text-ink/60">Try refreshing, or request a fresh login link.</p>
          <Link to="/my-reports" className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-sm text-white">Try again</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pb-20 text-ink">
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl">Your reports</h1>
              <p className="mt-1 text-sm text-ink/60">{data.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-2 text-xs font-medium text-ink/70 transition hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>

          {/* Subscription status */}
          {data.subscription ? (
            <div className="mt-6 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
                <Sparkles className="h-4 w-4" />
                {data.subscription.plan === "yearly" ? "Premium Yearly" : "Premium Monthly"}
              </div>
              <p className="mt-2 text-sm text-ink/80">
                Status: <span className="font-medium capitalize">{data.subscription.status}</span>
                {data.subscription.currentPeriodEnd && (
                  <> · renews {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </p>
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <CreditCard className="h-3.5 w-3.5" />
                {portalLoading ? "Opening…" : "Manage subscription"}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-border/60 bg-card p-5 text-sm text-ink/70 shadow-sm">
              No active subscription — you're on single-report access.
            </div>
          )}

          {/* Analyze another chat */}
          <Link
            to="/upload"
            className="mt-6 flex items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-sm font-medium text-white shadow-md transition hover:opacity-90"
          >
            <Heart className="h-4 w-4 fill-white" />
            Analyze a new chat
          </Link>

          {/* Report history */}
          <h2 className="font-serif mt-10 text-xl">History</h2>
          {data.reports.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">No reports yet on this email.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.reports.map((r) => (
                <Link
                  key={r.id}
                  to={r.paid ? "/report/$id" : "/results/$id"}
                  params={{ id: r.id }}
                  className="flex items-center justify-between rounded-3xl border border-border/60 bg-card p-4 shadow-sm transition hover:scale-[1.01] sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.headline ?? "VibeCheck report"}</p>
                    <p className="mt-1 text-xs text-ink/60">
                      {new Date(r.createdAt).toLocaleDateString()}
                      {r.interestScore != null && <> · {r.interestScore}% interest</>}
                      {!r.paid && <> · preview only</>}
                    </p>
                  </div>
                  <span
                    className={`ml-3 shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      r.paid ? "bg-mint-soft text-ink/80" : "bg-pink-soft text-pink"
                    }`}
                  >
                    {r.paid ? "Unlocked" : "Preview"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
