import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Sparkles, Activity, MessageSquare, Lock, RotateCcw } from "lucide-react";
import { getAnalysisPreview } from "@/lib/vibecheck.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/analyzing/$id")({
  head: () => ({
    meta: [
      { title: "Analyzing your vibe - VibeCheck" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyzingPage,
});

const STEPS = [
  { Icon: Sparkles, label: "Reading the energy of your conversation" },
  { Icon: Activity, label: "Detecting patterns in tone and replies" },
  { Icon: MessageSquare, label: "Calculating your compatibility vibes" },
];

// How long we let a run sit in "processing" before calling it stuck. The
// Claude vision call normally lands in 40-90s; past three minutes something
// has gone wrong that no amount of further waiting fixes (most likely the
// runAnalysis request never reached the server at all, so the row would sit
// at "processing" forever with nothing to flip it). Before this existed the
// page just held the bar at 92% indefinitely and the user eventually left -
// which is a large part of why only 3 of the 6 users who started an analysis
// ever reached a result.
const STALL_TIMEOUT_MS = 180_000;

function AnalyzingPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(15);
  const [stalled, setStalled] = useState(false);
  const startedAtRef = useRef(Date.now());

  const { data } = useQuery({
    queryKey: ["analysis-preview", id],
    queryFn: () => getAnalysisPreview({ data: { id } }),
    // Keep polling while processing; stop once we have a terminal status so
    // a finished or failed run doesn't hammer the endpoint forever.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "ready" || status === "failed" ? false : 2500;
    },
    // A backgrounded tab mid-analysis is the common case on mobile, not the
    // exception. Refetching on focus means someone who locks their phone and
    // comes back a minute later lands straight on their finished report
    // instead of a frozen progress bar.
    refetchOnWindowFocus: true,
    // Опрос должен продолжаться и в свёрнутой вкладке - иначе отчёт
    // дописывается на сервере, а страница ожидания навсегда стоит на 92%.
    refetchIntervalInBackground: true,
  });

  const status = data?.status;
  const failed = status === "failed";

  useEffect(() => {
    const iv = setInterval(() => setProgress((p) => Math.min(p + 3, 92)), 700);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (status === "ready" || status === "failed") return;
    const t = setTimeout(() => setStalled(true), STALL_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    if (status !== "ready") return;
    const processingSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
    trackEvent("analysis_completed", { report_id: id, processing_seconds: processingSeconds });
    navigate({ to: "/results/$id", params: { id } });
  }, [status, id, navigate]);

  useEffect(() => {
    if (!failed && !stalled) return;
    // Tracked so the real failure rate is visible in GA, rather than only
    // showing up as a silent gap between analysis_started and
    // analysis_completed that has to be inferred.
    trackEvent("analysis_failed", {
      report_id: id,
      reason: failed ? "server_error" : "timeout",
      waited_seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
    });
  }, [failed, stalled, id]);

  if (failed || stalled) {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader showUnlock={false} />
        <section className="px-5 pt-4">
          <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-pink-soft text-pink">
                <RotateCcw className="h-7 w-7" />
              </div>
              <h1 className="font-serif mt-6 text-3xl sm:text-4xl">That one didn't go through</h1>
              <p className="mt-3 max-w-sm text-sm text-ink/70">
                {failed
                  ? "Something broke while reading your screenshots. It happens - usually a blurry or partly cut-off shot."
                  : "This is taking much longer than it should, which usually means the connection dropped partway through."}
              </p>
              <p className="mt-2 max-w-sm text-sm text-ink/60">
                Nothing was charged and this one doesn't count against you - give it another go.
              </p>
              <Link
                to="/upload"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Try again
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-4">
        <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-28 w-28 place-items-center rounded-full bg-purple-soft"
            >
              <div className="grid h-20 w-20 place-items-center rounded-full bg-pink text-white shadow-md">
                <Heart className="h-8 w-8 fill-white" />
              </div>
            </motion.div>

            <h1 className="font-serif mt-6 text-3xl sm:text-4xl">Analyzing your vibe</h1>
            <p className="mt-3 text-sm text-ink/60">Reading the energy...</p>
            {/* Sets the expectation up front and, more importantly, tells
                people it's safe to leave. The old flow silently punished
                anyone who backgrounded the tab; now that's explicitly fine. */}
            <p className="mt-1 text-xs text-ink/45">
              Usually under a minute. You can leave this page open - we'll finish either way.
            </p>

            <div className="mt-6 w-full">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                  className="h-full bg-pink"
                />
              </div>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center text-xs text-ink/60">
                <span className="min-w-0 truncate">Crunching the details</span>
                <span className="shrink-0 font-medium text-ink">{progress}%</span>
              </div>
            </div>
          </div>

          <ul className="mt-8 space-y-4">
            {STEPS.map((s) => (
              <li key={s.label} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple-deep">
                  <s.Icon className="h-4 w-4" />
                </div>
                <span className="min-w-0 text-sm text-ink/80">{s.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl bg-muted/50 p-4 text-xs text-ink/60">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0">
              Your privacy is protected. Screenshots are heavily encrypted, analyzed instantly, and permanently deleted from our system immediately after processing.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
