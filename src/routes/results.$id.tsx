import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Sparkles, Lock, Heart, Flame, MessageCircle, AlertTriangle, TrendingUp, Users, Activity, BarChart3, Award, Film, Share2, Quote, Copy, Check } from "lucide-react";
import { getAnalysisPreview, getUnlockedCount } from "@/lib/vibecheck.functions";
import { computeDelusionLevel, type PreviewJson } from "@/lib/vibecheck-schema";
import { SiteHeader } from "@/components/SiteHeader";
import { ShareCard, exportShareCard, type ShareCardData } from "@/components/ShareCard";
import { InterestDonut } from "@/components/InterestDonut";
import { StickyUnlockBar } from "@/components/StickyUnlockBar";
import { trackEvent } from "@/lib/analytics";

const previewQuery = (id: string) =>
  queryOptions({
    queryKey: ["analysis-preview", id],
    queryFn: () => getAnalysisPreview({ data: { id } }),
  });

const unlockedCountQuery = queryOptions({
  queryKey: ["unlocked-count"],
  queryFn: () => getUnlockedCount(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Your vibe check - free preview" },
      { name: "description", content: "Free preview of your AI chat breakdown." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params, context }) => {
    context.queryClient.prefetchQuery(unlockedCountQuery);
    return context.queryClient.ensureQueryData(previewQuery(params.id));
  },
  component: ResultsPage,
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

function computeVerdict(p: PreviewJson) {
  const { interest_score: i, flirting_signals: f, toxicity_score: t, conversation_health: h } = p.scores;
  if (t >= 60 || h <= 35) return { title: "Red Flag Zone", tag: "Proceed with caution", tone: "danger" as const, blurb: "There's tension under the surface - the vibe is off in ways worth naming out loud." };
  if (i >= 75 && f >= 60) return { title: "Mutual Crush", tag: "It's giving main character energy", tone: "hot" as const, blurb: "Warm, playful energy flowing both ways. You two mirror each other's enthusiasm and keep the conversation alive with genuine curiosity." };
  if (i >= 70) return { title: "Warming Up", tag: "The spark is real", tone: "warm" as const, blurb: "They're leaning in. Real interest, real engagement - this one has legs if you keep the momentum." };
  if (i >= 50 && h < 65) return { title: "Mixed Signals", tag: "It's... complicated", tone: "caution" as const, blurb: "Some warmth, some distance. There's a pattern here you'll want to see before you invest more." };
  if (i < 45) return { title: "One-Sided Energy", tag: "You're doing the work", tone: "cold" as const, blurb: "The math isn't mathing. Effort and interest are lopsided - the full report shows exactly where." };
  return { title: "Steady Vibes", tag: "Low-key promising", tone: "neutral" as const, blurb: "Nothing electric yet, nothing broken. There's a slow-burn possibility here worth reading closer." };
}

const VERDICT_STYLES = {
  hot: { bg: "bg-pink", chip: "bg-white/15", icon: Flame },
  warm: { bg: "bg-pink", chip: "bg-white/15", icon: Heart },
  caution: { bg: "bg-purple", chip: "bg-white/15", icon: Sparkles },
  neutral: { bg: "bg-mint", chip: "bg-white/15", icon: Sparkles },
  cold: { bg: "bg-ink/70", chip: "bg-white/15", icon: MessageCircle },
  danger: { bg: "bg-destructive", chip: "bg-white/15", icon: AlertTriangle },
};

function ScoreBar({ label, value, Icon, tone = "pink" }: { label: string; value: number; Icon: typeof Heart; tone?: "pink" | "mint" | "purple" | "danger" }) {
  const barColor = { pink: "bg-pink", mint: "bg-mint", purple: "bg-purple", danger: "bg-destructive" }[tone];
  const chipColor = { pink: "text-pink", mint: "text-mint", purple: "text-purple", danger: "text-destructive" }[tone];
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${chipColor}`} />
          <span className="text-sm font-medium text-ink/80">{label}</span>
        </div>
        <span className={`font-serif text-xl ${chipColor}`}>{value}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${barColor}`}
        />
      </div>
    </div>
  );
}

function ResultsPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(previewQuery(id));
  const { data: unlocked } = useSuspenseQuery(unlockedCountQuery);
  const heroRef = useRef<HTMLDivElement>(null);
  const footerCtaRef = useRef<HTMLDivElement>(null);

  if (data.status === "failed") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">The AI couldn't read it</h1>
          <p className="mt-2 text-sm text-ink/60">
            Something went sideways on our end - not your screenshots. Give it another go.
          </p>
          <Link to="/upload" className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-white">Try again</Link>
        </div>
      </main>
    );
  }

  if (data.status !== "ready" || !data.preview_json) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <p className="text-sm text-ink/60">Still analyzing... refresh in a moment.</p>
      </main>
    );
  }

  const preview = data.preview_json as unknown as PreviewJson;
  const verdict = computeVerdict(preview);
  const V = VERDICT_STYLES[verdict.tone];
  const s = preview.scores;
  const viral = preview.viral_preview ?? null;
  const overallScore = Math.round(
    (s.interest_score + s.reciprocity_score + s.emotional_warmth + s.response_consistency + s.flirting_signals + (100 - s.toxicity_score) + s.conversation_health) / 7,
  );

  useEffect(() => {
    trackEvent("results_viewed", { report_id: id, compatibility_score: overallScore });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const shareData: ShareCardData = {
    award: viral?.vibe_award ?? null,
    popCulture: viral?.pop_culture_match ?? null,
    overallScore,
    headline: verdict.title,
  };
  const shareRef = useRef<HTMLDivElement>(null);
  const handleShare = async () => {
    if (shareRef.current) await exportShareCard(shareRef.current, "vibecheck.png");
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-cream pb-20 text-ink">
      <SiteHeader unlockHref="/paywall/$id" unlockParams={{ id }} />
      <section className="px-5 pt-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-mint text-white px-4 py-2 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Analysis Complete
            </span>
            <h1 className="font-serif mt-6 text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
              Your Vibe Results Are In
            </h1>
            <p className="mt-4 max-w-lg text-base text-ink/70">
              Here's the appetizer. The full report has the receipts - every red flag, exact quote, and forecast, zero sugarcoating.
            </p>
          </div>

          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative mt-8 overflow-hidden rounded-3xl ${V.bg} p-6 text-white shadow-lg sm:p-8`}
          >
            <span className={`inline-flex items-center gap-2 rounded-full ${V.chip} px-3 py-1 text-[11px] font-semibold uppercase tracking-widest`}>
              <V.icon className="h-3.5 w-3.5" />
              {verdict.tag}
            </span>
            <h2 className="font-serif mt-4 text-4xl leading-[1.05] sm:text-5xl">{verdict.title}</h2>
            <p className="mt-4 pr-20 text-base leading-relaxed text-white/90">{verdict.blurb}</p>
            <button
              onClick={handleShare}
              aria-label="Share to stories"
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur transition hover:bg-white/25"
            >
              <Share2 className="h-3 w-3" />
              Share
            </button>
          </motion.div>

          {viral?.vibe_award && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink via-purple to-ink p-6 text-white shadow-lg sm:p-8"
            >
              <div className="absolute right-4 top-4 text-[10px] uppercase tracking-widest text-white/60">VibeCheck</div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/80">
                <Award className="h-4 w-4" />
                Vibe Award
              </div>
              <h3 className="font-serif mt-4 text-4xl leading-[1.05] sm:text-5xl">{viral.vibe_award.title}</h3>
              <p className="mt-3 text-base text-white/90">{viral.vibe_award.subtitle}</p>
              <button
                onClick={handleShare}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/25"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share to Stories
              </button>
            </motion.div>
          )}

          {viral?.pop_culture_match && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative mt-5 rounded-3xl border border-purple/20 bg-purple-soft p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
                <Film className="h-4 w-4" />
                You're Giving...
              </div>
              <h3 className="font-serif mt-3 text-3xl leading-tight">{viral.pop_culture_match.couple}</h3>
              <div className="mt-1 text-xs uppercase tracking-widest text-ink/50">from {viral.pop_culture_match.source}</div>
              <p className="mt-4 pr-20 text-sm text-ink/80">{viral.pop_culture_match.explanation}</p>
              <button
                onClick={handleShare}
                aria-label="Share to stories"
                className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-purple/15 px-3 py-1.5 text-[11px] font-medium text-purple-deep backdrop-blur transition hover:bg-purple/25"
              >
                <Share2 className="h-3 w-3" />
                Share
              </button>
            </motion.div>
          )}

          <div className="mt-5 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-10">
            <h2 className="font-serif text-2xl sm:text-3xl">Interest Score</h2>
            <div className="mt-6">
              <InterestDonut value={s.interest_score} />
            </div>
            <p className="mt-6 text-sm text-ink/60">
              How invested they are, based on tone, response times, and engagement.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ScoreBar label="Reciprocity" value={s.reciprocity_score} Icon={Users} tone="pink" />
            <ScoreBar label="Emotional Warmth" value={s.emotional_warmth} Icon={Heart} tone="pink" />
            <ScoreBar label="Flirting Signals" value={s.flirting_signals} Icon={Flame} tone="purple" />
            <ScoreBar label="Response Consistency" value={s.response_consistency} Icon={TrendingUp} tone="mint" />
            <ScoreBar label="Conversation Health" value={s.conversation_health} Icon={Activity} tone="mint" />
            <ScoreBar label="Toxicity Level" value={s.toxicity_score} Icon={AlertTriangle} tone="danger" />
          </div>

          <div className="mt-5 rounded-3xl border border-purple/20 bg-purple-soft p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
              <Sparkles className="h-4 w-4" /> Delusion Level (just for fun)
            </div>
            <div className="mt-4 flex items-center gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white">
                <span className="font-serif text-lg text-purple-deep">{computeDelusionLevel(s).score}%</span>
              </div>
              <div>
                <h3 className="font-serif text-xl leading-tight">{computeDelusionLevel(s).label}</h3>
                <p className="mt-1 text-sm text-ink/70">{computeDelusionLevel(s).blurb}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-ink p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
              <BarChart3 className="h-3.5 w-3.5" />
              Receipt
            </div>
            <p className="font-serif mt-3 text-xl leading-snug sm:text-2xl">{preview.initiative_stat}</p>
            <p className="mt-3 text-xs text-white/50">
              3 more hard stats + full timeline dynamics inside the report.
            </p>
          </div>

          {viral?.first_keyword && (
            <div className="mt-5 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-pink">
                <Quote className="h-4 w-4" />
                The Word That's {viral.first_keyword.type === "green_flag" ? "Saving" : viral.first_keyword.type === "beige_flag" ? "Diluting" : "Killing"} It
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className={`font-serif text-4xl sm:text-5xl ${viral.first_keyword.type === "green_flag" ? "text-mint" : viral.first_keyword.type === "beige_flag" ? "text-ink/60" : "text-destructive"}`}>
                  "{viral.first_keyword.word}"
                </span>
              </div>
              <p className="mt-3 text-sm text-ink/80">{viral.first_keyword.impact}</p>
              {viral.keywords_count > 1 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-soft px-3 py-1.5 text-xs font-medium text-ink/80">
                  <Lock className="h-3 w-3" />
                  +{viral.keywords_count - 1} more words moving the needle
                </div>
              )}
            </div>
          )}

          {preview.green_flag_preview && (
            <div className="mt-5 rounded-3xl border border-mint/40 bg-mint-soft p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Green Flag</span>
                <span className="text-xs text-ink/60">1 of {preview.green_flags_count} found</span>
              </div>
              <h4 className="font-serif mt-3 text-xl">{preview.green_flag_preview.title}</h4>
              <p className="mt-2 text-sm italic text-ink/70">"{preview.green_flag_preview.quote}"</p>
              <p className="mt-2 text-sm text-ink/80">{preview.green_flag_preview.explanation}</p>
            </div>
          )}
          {preview.red_flag_preview && (
            <div className="mt-3 relative overflow-hidden rounded-3xl border border-destructive/30 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Red Flag</span>
                <span className="text-xs text-ink/60">{preview.red_flags_count} found - unlock to reveal</span>
              </div>
              <h4 className="font-serif mt-3 text-xl blur-sm select-none">{preview.red_flag_preview.title}</h4>
              <p className="mt-2 text-sm italic text-ink/70 blur-sm select-none">"the exact quote is locked - it's a receipt you'll want to see"</p>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/85 to-transparent" />
            </div>
          )}

          <div className="mt-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-soft px-4 py-2 text-xs font-medium text-ink/80">
              <Lock className="h-3.5 w-3.5" />
              Premium Insights
            </span>
            <h2 className="font-serif mt-4 text-3xl sm:text-4xl">Unlock the Full Story</h2>
            <p className="mt-3 max-w-md text-sm text-ink/70">
              Every red flag with verbatim receipts, full timeline dynamics, attachment style + Gottman pattern breakdown, and a forecast that doesn't flinch.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <LockedCard title="Hardcore Analytics" items={["Initiative ratio", "Engagement % breakdown", "Timeline shifts over the chat", "Communication style verdict"]} />
            <LockedCard title={`All ${preview.red_flags_count} Red Flags`} items={["Verbatim quote receipts", "Why each is a pattern", "Which ones are dealbreakers"]} />
            <LockedCard title="Psychological Analysis" items={["Attachment style prediction", "Gottman Four Horsemen check", "Power dynamic read"]} />
            <LockedCard title="Future Outlook" items={["3-5 sentence forecast", "What happens if nothing changes", "The one move that flips it"]} />
            <LockedCard title="Their Type in 3 Words" items={["The 3 words that define them", "Why they land that way", "How to work with (or around) it"]} />
            <LockedCard title="Vibe Decay Trajectory" items={["Weekly % interest change", "Cooling / rising / nose-diving", "Realistic window if nothing changes"]} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/compare/$id"
              params={{ id }}
              className="inline-flex items-center gap-2 rounded-full border border-purple/30 bg-purple-soft/40 px-5 py-2.5 text-sm font-medium text-purple-deep shadow-sm transition hover:bg-purple-soft/60"
            >
              <Users className="h-4 w-4" /> Compare Vibes with a friend
            </Link>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-full border border-mint/40 bg-mint-soft/50 px-5 py-2.5 text-sm font-medium text-ink/80 shadow-sm transition hover:bg-mint-soft"
            >
              {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {linkCopied ? "Link copied!" : "Send this to a friend"}
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-ink/60">
            <span className="inline-flex items-center gap-2 rounded-full bg-mint-soft px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              <span className="font-medium text-ink/80">{unlocked.count.toLocaleString("en-US")}</span>
              <span>reports unlocked</span>
            </span>
          </div>

          <div ref={footerCtaRef} className="mt-6">
            <Link
              to="/paywall/$id"
              params={{ id }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
            >
              <Lock className="h-4 w-4" />
              Unlock Full Report
            </Link>
            <p className="mt-3 text-center text-xs text-ink/60">
              One-time payment - Instant access - No receipts kept
            </p>
          </div>
        </div>
      </section>

      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <ShareCard ref={shareRef} data={shareData} />
      </div>

      <StickyUnlockBar id={id} showAfterRef={heroRef} hideNearRef={footerCtaRef} />
    </main>
  );
}

function LockedCard({ title, items }: { title: string; items: string[] }) {
  const [peek, setPeek] = useState(false);
  const togglePeek = () => setPeek((p) => !p);
  return (
    <button
      type="button"
      onClick={togglePeek}
      aria-pressed={peek}
      aria-label={peek ? `Hide ${title} preview` : `Tap to peek at ${title}`}
      className="group relative block w-full overflow-hidden rounded-3xl border border-border/60 bg-card p-5 text-left shadow-sm transition-transform hover:scale-[1.02]"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-soft text-ink/70">
          <Lock className="h-4 w-4" />
        </div>
        <h4 className="font-serif text-lg">{title}</h4>
      </div>
      <ul className={`mt-4 space-y-2 text-sm text-ink/70 transition-[filter] duration-200 ${peek ? "" : "blur-[3px]"}`}>
        {items.map((it) => (
          <li key={it} className="truncate">{it}</li>
        ))}
      </ul>
      {!peek && (
        <div className="pointer-events-none absolute right-3 top-3 animate-pulse rounded-full bg-ink/70 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white">
          tap to peek
        </div>
      )}
      {peek && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white">
          tap to hide
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/85 to-transparent" />
    </button>
  );
}
