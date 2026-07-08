import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Copy, Check, ArrowRight, Trophy } from "lucide-react";
import { getAnalysisPreview } from "@/lib/vibecheck.functions";
import { computeDelusionLevel, type PreviewJson } from "@/lib/vibecheck-schema";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Compare Vibes: a friend-referral mechanic that only ever touches data
// that's ALREADY public-by-id (the same preview_json getAnalysisPreview
// serves on the free /results/$id page, pre-paywall, no entitlement gate).
// Comparing two situationships' SCORES only — never raw chat content — so
// this doesn't raise the "publishing a third party's private data" issue
// that a public Wall of Vibes would.

const previewQuery = (id: string) =>
  queryOptions({
    queryKey: ["analysis-preview", id],
    queryFn: () => getAnalysisPreview({ data: { id } }),
  });

export const Route = createFileRoute("/compare/$id")({
  head: () => ({
    meta: [
      { title: "Compare Vibes — VibeCheck" },
      { name: "description", content: "Compare your vibe score with a friend's." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params, context }) => context.queryClient.ensureQueryData(previewQuery(params.id)),
  component: ComparePage,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
      <div>
        <h1 className="font-serif text-3xl">Something went sideways</h1>
        <p className="mt-2 text-sm text-ink/60">{error.message}</p>
        <Link to="/upload" className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-white">Try again</Link>
      </div>
    </main>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Not found</div>,
});

// Pulls a UUID out of either a raw id or a pasted full URL like
// vibecheck.app/results/<uuid> or /compare/<uuid> — friends will paste
// whichever link they have on hand, not necessarily a bare id.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
function extractId(input: string): string | null {
  const match = input.trim().match(UUID_RE);
  return match ? match[0] : null;
}

function overallScoreOf(s: PreviewJson["scores"]) {
  return Math.round(
    (s.interest_score + s.reciprocity_score + s.emotional_warmth + s.response_consistency + s.flirting_signals + (100 - s.toxicity_score) + s.conversation_health) / 7,
  );
}

function ScoreCard({ label, preview, highlight }: { label: string; preview: PreviewJson; highlight: boolean }) {
  const overall = overallScoreOf(preview.scores);
  const delusion = computeDelusionLevel(preview.scores);
  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${highlight ? "border-pink bg-pink-soft/40" : "border-border/60 bg-card"}`}>
      <div className="text-xs font-semibold uppercase tracking-widest text-ink/50">{label}</div>
      <div className="mt-4 flex items-center justify-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-sm">
          <div className="text-center">
            <div className="font-serif text-3xl leading-none">{overall}%</div>
            <div className="mt-0.5 text-[9px] uppercase tracking-widest text-ink/50">vibe</div>
          </div>
        </div>
      </div>
      {preview.viral_preview?.vibe_award && (
        <p className="mt-4 text-center font-serif text-lg leading-tight">{preview.viral_preview.vibe_award.title}</p>
      )}
      <div className="mt-4 rounded-2xl bg-muted/50 p-3 text-center">
        <div className="text-[10px] uppercase tracking-widest text-purple-deep">Delusion Level</div>
        <div className="mt-1 font-serif text-xl">{delusion.score}% · {delusion.label}</div>
      </div>
    </div>
  );
}

function ComparePage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(previewQuery(id));
  const [friendInput, setFriendInput] = useState("");
  const [friendData, setFriendData] = useState<PreviewJson | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const myPreview = data.status === "ready" ? (data.preview_json as unknown as PreviewJson) : null;

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/compare/${id}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompare = async () => {
    const parsed = extractId(friendInput);
    if (!parsed) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const result = await getAnalysisPreview({ data: { id: parsed } });
      if (result.status !== "ready" || !result.preview_json) {
        setStatus("error");
        return;
      }
      setFriendData(result.preview_json as unknown as PreviewJson);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  if (!myPreview) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <p className="text-sm text-ink/60">This report isn't ready yet — try again in a moment.</p>
      </main>
    );
  }

  const myOverall = overallScoreOf(myPreview.scores);
  const friendOverall = friendData ? overallScoreOf(friendData.scores) : null;
  const winner =
    friendOverall !== null
      ? myOverall === friendOverall
        ? "tie"
        : myOverall > friendOverall
          ? "mine"
          : "friend"
      : null;

  return (
    <main className="min-h-screen bg-cream pb-20 text-ink">
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep sm:text-sm">
              <Heart className="h-3.5 w-3.5" />
              Compare Vibes
            </span>
            <h1 className="font-serif mt-6 text-4xl leading-[1.05] sm:text-5xl">
              Whose vibe hits harder?
            </h1>
            <p className="mt-4 max-w-md text-sm text-ink/70">
              Paste a friend's VibeCheck link below to see both scores side by side — only the numbers, never the actual chat.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <ScoreCard label="This report" preview={myPreview} highlight={winner === "mine"} />
            {friendData ? (
              <ScoreCard label="Their report" preview={friendData} highlight={winner === "friend"} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-purple-soft bg-purple-soft/20 p-6 text-center">
                <Sparkles className="h-6 w-6 text-purple-deep" />
                <p className="text-sm text-ink/60">Paste a friend's link below to fill this in</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-ink p-4 text-center text-sm font-medium text-white"
              >
                <Trophy className="h-4 w-4 text-pink" />
                {winner === "tie"
                  ? "Dead even — you're both equally in it."
                  : winner === "mine"
                    ? "This report's vibe scores higher. 🏆"
                    : "Their vibe scores higher this round. 🏆"}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <label htmlFor="friend-link" className="text-sm font-medium text-ink">
              Got a friend's link or ID?
            </label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="friend-link"
                value={friendInput}
                onChange={(e) => { setFriendInput(e.target.value); setStatus("idle"); }}
                placeholder="Paste their vibecheck.app link or report ID"
                className="w-full min-w-0 rounded-full border border-border bg-cream px-4 py-3 text-sm outline-none focus:border-pink"
              />
              <button
                onClick={handleCompare}
                disabled={status === "loading" || !friendInput.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-pink px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {status === "loading" ? "Loading…" : "Compare"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {status === "error" && (
              <p className="mt-2 text-xs text-destructive">
                Couldn't find that report — double check the link, or make sure their analysis has finished.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-purple-soft/40 p-6 text-center">
            <p className="text-sm text-ink/80">Don't have a friend's link yet? Send them yours.</p>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-full border border-purple/30 bg-white px-5 py-2.5 text-sm font-medium text-purple-deep shadow-sm transition hover:bg-purple-soft/60"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link copied!" : "Copy my Compare Link"}
            </button>
            <Link to="/upload" className="text-xs text-ink/50 hover:text-ink">
              Don't have a VibeCheck yet? Start one →
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
