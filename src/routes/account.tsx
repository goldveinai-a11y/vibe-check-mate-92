import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2, LogOut, CreditCard, Sparkles, ExternalLink, History, Gift, Copy, Check, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyReports, createBillingPortalSession, getOrCreateReferralCode, renameReport, type MyReportsResult } from "@/lib/vibecheck.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { getAnonId } from "@/lib/anon-id";
import { SiteHeader } from "@/components/SiteHeader";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your reports - VibeCheck" },
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
  const [referral, setReferral] = useState<{ code: string; redemptionCount: number } | null>(null);
  const [copied, setCopied] = useState(false);
  // Renaming state - deliberately refetches getMyReports() after a
  // successful save rather than patching local state optimistically, since
  // clearing a custom_label needs the server's recomputed auto-headline
  // (title/pop-culture couple), which isn't available client-side.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!sessionData.session) {
        setState("signed-out");
        return;
      }
      trackEvent("login", { login_method: "returning_session" });
      setState("loading");
      try {
        const result = await getMyReports();
        if (cancelled) return;
        setData(result);
        setState("ready");
        trackEvent("my_reports_viewed", { report_count: result.reports.length });
        // Referral code fetch is best-effort - if it fails, the rest of the
        // account page still works, so it's isolated from the main load path.
        getOrCreateReferralCode({ data: { ownerAnonId: getAnonId() } })
          .then((r) => { if (!cancelled) setReferral(r); })
          .catch(() => {});
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

  function startEdit(r: MyReportsResult["reports"][number]) {
    setEditingId(r.id);
    setEditValue(r.isCustomLabel ? (r.headline ?? "") : "");
  }
  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }
  async function saveEdit(id: string) {
    setSavingId(id);
    try {
      const result = await renameReport({ data: { id, label: editValue } });
      if ("error" in result) {
        alert("Couldn't rename that report - try refreshing the page.");
        return;
      }
      const refreshed = await getMyReports();
      setData(refreshed);
      setEditingId(null);
      setEditValue("");
    } finally {
      setSavingId(null);
    }
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
                {portalLoading ? "Opening..." : "Manage subscription"}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-border/60 bg-card p-5 text-sm text-ink/70 shadow-sm">
              No active subscription - you're on single-report access.
            </div>
          )}

          {/* Wingman referral V1 */}
          {referral && (
            <div className="mt-6 rounded-3xl border border-purple/20 bg-purple-soft p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
                <Gift className="h-4 w-4" /> Give a Friend 20% Off
              </div>
              <p className="mt-2 text-sm text-ink/80">
                Share your link - whoever uses it gets 20% off their report.
              </p>
              <button
                onClick={async () => {
                  const link = `${window.location.origin}/upload?ref=${referral.code}`;
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-purple-deep shadow-sm transition hover:bg-purple-soft/60"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy my referral link"}
              </button>
              {referral.redemptionCount > 0 && (
                <p className="mt-3 text-center text-xs text-ink/60">
                  {referral.redemptionCount} {referral.redemptionCount === 1 ? "friend has" : "friends have"} unlocked a report via your link 🎉
                </p>
              )}
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
              {data.reports.map((r) => {
                const daysSinceActivity = (Date.now() - new Date(r.lastActivityAt).getTime()) / 86_400_000;
                const showNudge = r.paid && daysSinceActivity >= 7;
                const isEditing = editingId === r.id;
                return (
                  <div
                    key={r.id}
                    className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm transition hover:scale-[1.01] sm:p-5"
                  >
                    {isEditing ? (
                      // Own form instead of nesting an input inside the Link
                      // below - clicking into a text field inside an <a>
                      // would otherwise risk triggering navigation.
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveEdit(r.id);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          maxLength={60}
                          placeholder="Name this report - e.g. 'Alex, week 2'"
                          className="min-w-0 flex-1 rounded-full border border-border bg-cream px-3.5 py-2 text-sm outline-none focus:border-pink"
                        />
                        <button
                          type="submit"
                          disabled={savingId === r.id}
                          className="shrink-0 rounded-full bg-pink px-3.5 py-2 text-xs font-medium text-white shadow-sm disabled:opacity-50"
                        >
                          {savingId === r.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="shrink-0 rounded-full border border-border/60 px-3.5 py-2 text-xs font-medium text-ink/70 hover:text-ink"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link
                          to={r.paid ? "/report/$id" : "/results/$id"}
                          params={{ id: r.id }}
                          className="flex min-w-0 flex-1 items-center justify-between"
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
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          aria-label="Rename this report"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/40 transition hover:bg-muted hover:text-ink"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {showNudge && !isEditing && (
                      <Link
                        to="/checkin/$id"
                        params={{ id: r.id }}
                        className="mt-3 flex items-center gap-2 rounded-2xl bg-purple-soft/60 px-3.5 py-2.5 text-xs font-medium text-purple-deep transition hover:bg-purple-soft"
                      >
                        <History className="h-3.5 w-3.5 shrink-0" />
                        {Math.round(daysSinceActivity)} days since your last check-in - see if the vibe shifted →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
