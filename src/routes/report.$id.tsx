import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Heart, Flag as FlagIcon, MessageCircle, Bell, Star, CheckCircle, AlertCircle, Sparkles, Award, Film, Quote, TrendingDown, TrendingUp, Minus, Share2, Send, Copy, Check, History, Wind } from "lucide-react";
import { getAnalysisFull, getCheckins } from "@/lib/vibecheck.functions";
import { getAnonId } from "@/lib/anon-id";
import type { Report, Flag } from "@/lib/vibecheck-schema";
import { computeDelusionLevel } from "@/lib/vibecheck-schema";
import { SiteHeader } from "@/components/SiteHeader";
import { ShareCard, exportShareCard, type ShareCardData } from "@/components/ShareCard";
import { CompatibilityRadar } from "@/components/CompatibilityRadar";
import { ReportChat } from "@/components/ReportChat";
import { WordCloud } from "@/components/WordCloud";
import { SiteFooter } from "@/components/SiteFooter";
import { trackEvent } from "@/lib/analytics";

const fullQuery = (id: string, ownerAnonId: string) =>
  queryOptions({
    queryKey: ["analysis-full", id, ownerAnonId],
    queryFn: () => getAnalysisFull({ data: { id, ownerAnonId } }),
  });

export const Route = createFileRoute("/report/$id")({
  head: () => ({
    meta: [
      { title: "Your full VibeCheck report" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
      <div>
        <h1 className="font-serif text-3xl">Report unavailable</h1>
        <p className="mt-2 text-sm text-ink/60">{error.message}</p>
      </div>
    </main>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Not found</div>,
});

function ReportPage() {
  const { id } = Route.useParams();
  const ownerAnonId = typeof window !== "undefined" ? getAnonId() : "ssr-placeholder-anon-id";
  const { data } = useSuspenseQuery(fullQuery(id, ownerAnonId));

  if ("locked" in data && data.locked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">Locked</h1>
          <p className="mt-2 text-sm text-ink/60">Complete payment to view your full report.</p>
          <Link to="/paywall/$id" params={{ id }} className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-white">Unlock</Link>
        </div>
      </main>
    );
  }

  const { report, createdAt } = data as { locked: false; report: Report; createdAt: string };
  const viral = report.viral;
  const s = report.scores;
  const overallScore = Math.round(
    (s.interest_score + s.reciprocity_score + s.emotional_warmth + s.response_consistency + s.flirting_signals + (100 - s.toxicity_score) + s.conversation_health) / 7,
  );

  useEffect(() => {
    trackEvent("report_viewed", { report_id: id, is_paid_user: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const delusion = computeDelusionLevel(s);
  const shareData: ShareCardData = {
    award: viral?.vibe_award ?? null,
    popCulture: viral?.pop_culture_match ?? null,
    overallScore,
    headline: "Full Report Unlocked",
  };
  const shareRef = useRef<HTMLDivElement>(null);
  const handleShare = async () => {
    trackEvent("report_shared", { report_id: id, share_method: "share_card" });
    if (shareRef.current) await exportShareCard(shareRef.current, "vibecheck.png");
  };

  // The exported ShareCard images are dead ends for the person who
  // receives them - no way back into the funnel. Copying this page's own
  // URL keeps the on-page CTAs (paywall, Compare Vibes) intact for whoever
  // opens it. Mirrors the same "Send this to a friend" pattern already
  // shipped on the free /results/$id preview page.
  const [linkCopied, setLinkCopied] = useState(false);
  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    trackEvent("report_shared", { report_id: id, share_method: "copy_link" });
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const wordCloudShareRef = useRef<HTMLDivElement>(null);
  const handleShareWordCloud = async () => {
    trackEvent("report_shared", { report_id: id, share_method: "word_cloud" });
    if (wordCloudShareRef.current) await exportShareCard(wordCloudShareRef.current, "vibecheck-words.png");
  };

  const threeWordsShareRef = useRef<HTMLDivElement>(null);
  const handleShareThreeWords = async () => {
    trackEvent("report_shared", { report_id: id, share_method: "three_words" });
    if (threeWordsShareRef.current) await exportShareCard(threeWordsShareRef.current, "vibecheck-type.png");
  };

  const badgeShareRef = useRef<HTMLDivElement>(null);
  const handleShareBadge = async () => {
    trackEvent("report_shared", { report_id: id, share_method: "badge" });
    if (badgeShareRef.current) await exportShareCard(badgeShareRef.current, "vibecheck-badge.png");
  };

  const checkinsQuery = useQuery({
    queryKey: ["checkins", id, ownerAnonId],
    queryFn: () => getCheckins({ data: { id, ownerAnonId } }),
    enabled: !!ownerAnonId,
  });

  // Real trend: the original report is data point #1, every check-in adds
  // another. Two or more real points is what makes the trend real instead
  // of the seeded, AI-predicted one-shot narrative.
  const realTrend = useMemo(() => {
    const checkins = checkinsQuery.data?.checkins ?? [];
    if (checkins.length < 1) return null;
    const points = [
      { t: new Date(createdAt).getTime(), score: overallScore },
      ...checkins.map((c) => ({ t: new Date(c.createdAt).getTime(), score: c.overallScore })),
    ].sort((a, b) => a.t - b.t);
    return computeRealTrend(points);
  }, [checkinsQuery.data, createdAt, overallScore]);

  return (
    <main className="min-h-screen bg-cream pb-20 text-ink">
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-xs font-medium text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Premium Report Unlocked
            </span>
            <h1 className="font-serif mt-6 text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
              Your Full Compatibility Report
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink/70">
              Here's the deep dive into your connection - compatibility, flags, tone, and where things might be headed.
            </p>
          </div>

          <div className="mt-10 space-y-5">
            {viral?.vibe_award && (
              <div className="shimmer relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink via-purple to-ink p-6 text-white shadow-lg sm:p-8">
                <div className="absolute right-4 top-4 text-[10px] uppercase tracking-widest text-white/60">VibeCheck</div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/80">
                  <Award className="h-4 w-4" /> Vibe Award
                </div>
                <h3 className="font-serif mt-4 text-4xl leading-[1.05] sm:text-5xl">{viral.vibe_award.title}</h3>
                <p className="mt-3 text-base text-white/90">{viral.vibe_award.subtitle}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/25"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share to Stories
                  </button>
                  <button
                    onClick={handleShareBadge}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/10"
                  >
                    <Award className="h-3.5 w-3.5" /> Save as Profile Badge
                  </button>
                </div>
              </div>
            )}

            {/* Jump-link to the AI chat card (id="ask-report-chat" in
                ReportChat.tsx). That card sits ~8 cards down the scroll
                behind content of identical visual weight, so it was easy to
                miss entirely - this puts the offer in front of people right
                after the first big "wow" moment (Vibe Award) instead of
                relying on them to scroll-discover it later. Plain button +
                scrollIntoView rather than an <a href="#..."> so it works
                the same regardless of whether smooth-scroll CSS is set
                anywhere globally. */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("ask-report-chat")?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className="inline-flex items-center gap-2 rounded-full border border-purple/30 bg-purple-soft/60 px-5 py-2.5 text-sm font-medium text-purple-deep shadow-sm transition hover:bg-purple-soft"
              >
                <Sparkles className="h-4 w-4" />
                Got questions about this read? Ask the AI below ↓
              </button>
            </div>

            {/* Delusion Level - pure arithmetic on the 7 scores above, not a
                new AI judgment. Gap between "feels exciting" and "actually
                reciprocated", framed as a for-fun read like Vibe Award. */}
            <div className="rounded-3xl border border-purple/20 bg-purple-soft p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
                <Sparkles className="h-4 w-4" /> Delusion Level (just for fun)
              </div>
              <div className="mt-4 flex items-center gap-5">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white">
                  <span className="font-serif text-2xl text-purple-deep">{delusion.score}%</span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl leading-tight">{delusion.label}</h3>
                  <p className="mt-1 text-sm text-ink/70">{delusion.blurb}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-ink/50">
                Calculated from the same scores below - the gap between how exciting this feels (flirting + warmth) and how much of that is actually reciprocated (consistency + reciprocity + health).
              </p>
            </div>

            {viral?.pop_culture_match && (
              <ReportSection Icon={Film} title="You're Giving...">
                <h3 className="font-serif text-3xl leading-tight">{viral.pop_culture_match.couple}</h3>
                <div className="mt-1 text-xs uppercase tracking-widest text-ink/50">from {viral.pop_culture_match.source}</div>
                <p className="mt-4 text-sm text-ink/80">{viral.pop_culture_match.explanation}</p>
                {/* Every other viral/shareable card on this page (Vibe Award,
                    Their Type in 3 Words, Words That Moved the Needle) has a
                    Share to Stories button - this one was missing it. Reuses
                    the same handleShare + shareRef as the Vibe Award card:
                    the default ShareCard variant already renders the
                    pop_culture_match line (see shareData above), so no new
                    ShareCard variant or export target is needed here. */}
                <button
                  onClick={handleShare}
                  className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-ink shadow-sm transition hover:bg-muted"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share to Stories
                </button>
              </ReportSection>
            )}

            {viral?.their_type_in_3_words && (
              <ReportSection Icon={Sparkles} title="Their Type in 3 Words">
                <div className="flex flex-wrap justify-center gap-3">
                  {viral.their_type_in_3_words.map((w, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-purple-soft px-6 py-3 font-serif text-2xl text-purple-deep sm:text-3xl"
                    >
                      {w}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleShareThreeWords}
                  className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-ink shadow-sm transition hover:bg-muted"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share to Stories
                </button>
              </ReportSection>
            )}

            {(viral?.vibe_decay || realTrend) && (
              <VibeDecayCard
                reportId={id}
                predicted={viral?.vibe_decay ?? null}
                real={realTrend}
              />
            )}

            {viral?.viral_keywords && viral.viral_keywords.length > 0 && (
              <ReportSection Icon={Quote} title="Words That Moved the Needle">
                <p className="mb-1 text-center text-xs text-ink/50">
                  The full story behind each flag is below, in Red &amp; Green Flags - this is just the highlight reel.
                </p>
                <WordCloud keywords={viral.viral_keywords} />
                <button
                  onClick={handleShareWordCloud}
                  className="mx-auto flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-ink shadow-sm transition hover:bg-muted"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share to Stories
                </button>
              </ReportSection>
            )}

            <ReportSection Icon={Heart} title="Compatibility Breakdown">
              <CompatibilityRadar
                metrics={[
                  { label: "Interest", value: report.scores.interest_score },
                  { label: "Reciprocity", value: report.scores.reciprocity_score },
                  { label: "Warmth", value: report.scores.emotional_warmth },
                  { label: "Consistency", value: report.scores.response_consistency },
                  { label: "Flirting", value: report.scores.flirting_signals },
                  { label: "Health", value: report.scores.conversation_health },
                  { label: "Non-toxic", value: 100 - report.scores.toxicity_score },
                ]}
              />
              <p className="mt-4 text-center text-xs text-ink/50">
                Higher is better across all seven axes.
              </p>
            </ReportSection>

            <ReportChat
              analysisId={id}
              ownerAnonId={ownerAnonId}
              context={{
                hasRedFlags: report.red_flags.length > 0,
                trajectory: realTrend?.trajectory ?? viral?.vibe_decay?.trajectory ?? "steady",
                delusionScore: delusion.score,
                hasSuggestedReplies: !!report.suggested_replies,
              }}
            />

            <ReportSection Icon={MessageCircle} title="Hardcore Analytics">
              <div className="space-y-3">
                {([
                  ["Initiative", report.hardcore_analytics.initiative_stat],
                  ["Engagement", report.hardcore_analytics.engagement_stat],
                  ["Timeline shifts", report.hardcore_analytics.timeline_changes],
                  ["Communication style", report.hardcore_analytics.communication_style],
                ] as const).map(([label, val]) => {
                  const stat = extractLeadStat(val);
                  return (
                    <div key={label} className="rounded-2xl bg-muted/50 p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-xs uppercase tracking-widest text-purple">{label}</p>
                        {stat && <span className="shrink-0 text-2xl font-bold text-ink">{stat}</span>}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink/85">{val}</p>
                    </div>
                  );
                })}
              </div>
            </ReportSection>

            <ReportSection Icon={FlagIcon} title="Red & Green Flags">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-mint text-white">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </span>
                    Green Flags · {report.green_flags.length}
                  </div>
                  <div className="mt-3 space-y-3">
                    {report.green_flags.map((f, i) => <FlagRow key={i} tone="green" flag={f} />)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-destructive text-white">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </span>
                    Red Flags · {report.red_flags.length}
                  </div>
                  <div className="mt-3 space-y-3">
                    {report.red_flags.map((f, i) => <FlagRow key={i} tone="red" flag={f} />)}
                  </div>
                </div>
              </div>
            </ReportSection>

            <ReportSection Icon={Sparkles} title="Psychological Analysis">
              <div className="space-y-4">
                <PullQuoteBlock
                  label="Attachment style prediction"
                  text={report.psychological_analysis.attachment_style_prediction}
                  accent="purple"
                />
                <PullQuoteBlock
                  label="Gottman patterns"
                  text={report.psychological_analysis.gottman_patterns}
                  accent="pink"
                />
              </div>
            </ReportSection>

            <ReportSection Icon={Bell} title="Future Outlook">
              <PullQuoteBlock text={report.future_outlook} accent="purple" bare />
            </ReportSection>

            {report.suggested_replies && (
              <ReportSection Icon={Send} title="Reply Help">
                <p className="mb-4 text-sm text-ink/60">
                  Not sure what to say back? Two ready-to-send drafts, pick your energy.
                </p>
                <div className="space-y-3">
                  <ReplyCard label="Warm & Interested" text={report.suggested_replies.warm} accent="pink" />
                  <ReplyCard label="Neutral & Reserved" text={report.suggested_replies.neutral} accent="purple" />
                </div>
              </ReportSection>
            )}

            {/* Was a solid bg-pink block - reads as an alarm/warning color
                at that size and saturation regardless of what the verdict
                actually says, so a genuinely good read still looked like a
                red-flag card. Softened to the same pink-soft-card language
                used elsewhere (Delusion Level etc.), with the icon itself
                carrying the pink accent instead of the whole card. */}
            <div className="rounded-3xl border border-pink/20 bg-pink-soft p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3 text-ink">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink text-white">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-2xl">The Verdict</h3>
              </div>
              <PullQuoteBlock
                text={report.hardcore_analytics.communication_style}
                accent="ink"
                bare
                className="mt-4"
              />
            </div>

            <CloseTheLoop report={report} overallScore={overallScore} />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-center">
            <Link
              to="/compare/$id"
              params={{ id }}
              className="inline-flex items-center gap-2 rounded-full border border-purple/30 bg-purple-soft/40 px-6 py-3 text-sm font-medium text-purple-deep shadow-sm transition hover:bg-purple-soft/60"
            >
              <Heart className="h-4 w-4" /> Compare Vibes with a friend
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-ink shadow-sm transition hover:bg-muted"
            >
              <Sparkles className="h-4 w-4" />
              Analyze Another Chat
            </Link>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-full border border-mint/40 bg-mint-soft/50 px-6 py-3 text-sm font-medium text-ink/80 shadow-sm transition hover:bg-mint-soft"
            >
              {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {linkCopied ? "Link copied!" : "Send this report to a friend"}
            </button>
          </div>
        </div>
      </section>

      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <ShareCard ref={shareRef} data={shareData} />
        {viral?.viral_keywords && (
          <ShareCard
            ref={wordCloudShareRef}
            variant="wordcloud"
            data={{ ...shareData, keywords: viral.viral_keywords }}
          />
        )}
        {viral?.their_type_in_3_words && (
          <ShareCard
            ref={threeWordsShareRef}
            variant="threewords"
            data={{ ...shareData, threeWords: viral.their_type_in_3_words }}
          />
        )}
        {viral?.vibe_award && (
          <ShareCard ref={badgeShareRef} variant="badge" data={shareData} />
        )}
      </div>

      <SiteFooter />
    </main>
  );
}

function ReportSection({ Icon, title, children }: { Icon: typeof Heart; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple-deep">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-serif text-xl sm:text-2xl">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

// Naive ".!?"-based sentence splitting broke whenever the AI-generated text
// quoted a chat line that itself contains a "?" (e.g. an embedded Russian
// quote like 'Может завтра?)' mid-sentence) - it treated that inner "?" as
// the end of the whole English sentence, so the quote's closing punctuation
// ")'" ended up starting its own orphaned paragraph. Fix: track whether
// we're inside a straight-quoted fragment and ignore terminators while
// inQuote. A quote only "opens" when the preceding character isn't
// alphanumeric, so contractions ("she's") and decades ("'90s") never get
// mistaken for quote marks; the very next apostrophe after that closes it.
function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === "'") {
      if (inQuote) {
        inQuote = false;
      } else if (!/[a-zA-Zа-яёА-ЯЁ0-9]/.test(i > 0 ? text[i - 1] : "")) {
        inQuote = true;
      }
      continue;
    }
    if ((ch === "." || ch === "!" || ch === "?") && !inQuote) {
      let j = i + 1;
      while (j < text.length && /[.!?]/.test(text[j])) j++;
      sentences.push(text.slice(start, j).trim());
      start = j;
      i = j - 1;
    }
  }
  const tail = text.slice(start).trim();
  if (tail) sentences.push(tail);
  return sentences.filter(Boolean);
}

function PullQuoteBlock({
  label,
  text,
  accent,
  bare,
  className,
}: {
  label?: string;
  text: string;
  accent: "purple" | "pink" | "ink";
  bare?: boolean;
  className?: string;
}) {
  const parsed = splitIntoSentences(text);
  const sentences = parsed.length > 0 ? parsed : [text];
  const lead = sentences[0] ?? text;
  // Group the remaining sentences into short 1-2 sentence paragraphs instead
  // of one merged wall of text - same words, but broken into something a
  // phone screen can actually be skimmed at instead of read start to finish.
  const restSentences = sentences.slice(1);
  const restParagraphs: string[] = [];
  for (let i = 0; i < restSentences.length; i += 2) {
    restParagraphs.push(restSentences.slice(i, i + 2).join(" ").trim());
  }

  const accentText =
    accent === "purple" ? "text-purple-deep" : accent === "pink" ? "text-pink" : "text-ink";
  const accentBar =
    accent === "purple" ? "bg-purple" : accent === "pink" ? "bg-pink" : "bg-ink";
  const accentBg =
    accent === "purple" ? "bg-purple-soft/60" : accent === "pink" ? "bg-pink-soft" : "";

  return (
    <div className={`${bare ? "" : `rounded-2xl p-4 ${accentBg}`} ${className ?? ""}`.trim()}>
      {label && (
        <p className={`text-xs uppercase tracking-widest ${accentText}`}>{label}</p>
      )}
      <div className={`${label ? "mt-3" : ""} flex gap-3`}>
        <span className={`w-1 shrink-0 rounded-full ${accentBar}`} aria-hidden />
        <p className="font-serif text-xl leading-snug text-ink/90 sm:text-2xl">{lead}</p>
      </div>
      {restParagraphs.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {restParagraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-ink/75">{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function DecaySparkline({
  trajectory,
  delta,
  seed,
}: {
  trajectory: NonNullable<Report["viral"]>["vibe_decay"]["trajectory"];
  delta: number;
  seed: string;
}) {
  const w = 600;
  const h = 120;
  const pad = 8;
  const n = 8;

  // Deterministic pseudo-random from seed string.
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffff) / 0xffff;
  };

  const slope =
    trajectory === "rising" ? 0.35 :
    trajectory === "steady" ? 0 :
    trajectory === "cooling" ? -0.3 : -0.55;

  const start = trajectory === "nose-diving" ? 0.85 : trajectory === "cooling" ? 0.78 : trajectory === "steady" ? 0.55 : 0.35;
  const points: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const noise = (rand() - 0.5) * 0.12;
    const y = Math.max(0.05, Math.min(0.95, start + slope * t + noise));
    points.push(y);
  }
  // Nudge final point in the direction of delta for visual truth.
  const last = Math.max(0.05, Math.min(0.95, points[n - 1] + (delta / 100) * 0.15));
  points[n - 1] = last;

  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / (n - 1));
  const ys = points.map((y) => pad + (1 - y) * (h - pad * 2));
  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xs[n - 1].toFixed(1)} ${h - pad} L ${xs[0].toFixed(1)} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 100 }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pink)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--pink)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#spark-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--purple)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <circle cx={xs[n - 1]} cy={ys[n - 1]} r={5} fill="var(--purple)" />
      <circle cx={xs[n - 1]} cy={ys[n - 1]} r={9} fill="var(--purple)" opacity={0.25} />
    </svg>
  );
}

function ReplyCard({ label, text, accent }: { label: string; text: string; accent: "pink" | "purple" }) {
  const [copied, setCopied] = useState(false);
  const bg = accent === "pink" ? "bg-pink-soft" : "bg-purple-soft";
  const accentText = accent === "pink" ? "text-pink" : "text-purple-deep";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable - no-op, button just won't confirm
    }
  };

  return (
    <div className={`rounded-2xl p-4 ${bg}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-semibold uppercase tracking-widest ${accentText}`}>{label}</p>
        <button
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition hover:bg-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink/85">"{text}"</p>
    </div>
  );
}

// "Close the Gestalt" - the Zeigarnik effect (unfinished situations loop in
// memory harder than resolved ones) says the report itself already gives
// closure; this just gives that moment a physical, interactive beat instead
// of the report silently ending. No new data, no invented percentages -
// just a framed pause on what's already been said (vibe_award / overallScore
// / future_outlook), reusing values already in scope on the report page.
function CloseTheLoop({ report, overallScore }: { report: Report; overallScore: number }) {
  const [closed, setClosed] = useState(false);
  // Was "You have your read: couch potato with potential -" which reads as
  // a grammar error (label doesn't fit as the object of "have"), and just
  // restated the pre-click line ("You've got your answer now") instead of
  // adding anything. Rephrased as an appositive so the label slots in
  // naturally, and kept Title Case for the vibe-award version since it's a
  // named result, not lowercase filler.
  const label = report.viral?.vibe_award?.title
    ? report.viral.vibe_award.title
    : `a clear ${overallScore}% read`;

  return (
    <div className="relative mt-2 overflow-hidden rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-8">
      <AnimatePresence mode="wait">
        {!closed ? (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3 }}
          >
            <p className="mx-auto max-w-md text-sm text-ink/60">
              Still replaying their last message in your head? That looping feeling has a name - the Zeigarnik effect. Unfinished things stick. You've got your answer now.
            </p>
            <button
              onClick={() => setClosed(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-medium text-white transition duration-500 hover:shadow-[0_0_30px_6px_rgba(236,72,153,0.35)]"
            >
              <Wind className="h-4 w-4" />
              Close the loop and exhale
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="closed"
            className="relative"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid place-items-center"
              initial={{ opacity: 0.55, scale: 0.6 }}
              animate={{ opacity: 0, scale: 2.4 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div className="h-24 w-24 rounded-full bg-purple-soft blur-2xl" />
            </motion.div>
            <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full bg-mint text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-serif relative mt-4 text-2xl">Loop closed.</h3>
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/75">
              You know exactly where you stand: {label}. Whatever happens next, you're not walking in blind anymore.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FlagRow({ tone, flag }: { tone: "green" | "red"; flag: Flag }) {
  const isGreen = tone === "green";
  return (
    <div className={`rounded-2xl p-4 ${isGreen ? "bg-mint-soft" : "bg-destructive/10"}`}>
      <h4 className="font-serif text-lg leading-tight">
        <span aria-hidden="true" className="mr-1.5">{isGreen ? "💚" : "🚩"}</span>
        {flag.title}
      </h4>
      <blockquote className="mt-2 border-l-2 border-current pl-3 text-sm italic opacity-80">"{flag.quote}"</blockquote>
      <p className="mt-2 text-sm text-ink/80">{flag.explanation}</p>
    </div>
  );
}

type TrendKind = "rising" | "steady" | "cooling" | "nose-diving";

type RealTrend = {
  trajectory: TrendKind;
  weeklyDeltaPct: number;
  range: string;
  verdict: string;
  points: number[];
  checkinsCount: number;
};

// Pulls the first hard number out of a hardcore_analytics sentence (e.g.
// "They initiate 73% of conversations..." -> "73%") so it can be rendered
// large, data-panel style, ahead of the sentence - instead of the number
// being buried mid-paragraph in body text.
function extractLeadStat(text: string): string | null {
  const match = text.match(/-?\d+(\.\d+)?%|\b\d+(\.\d+)?x\b|\b\d+\/\d+\b/i);
  return match ? match[0] : null;
}

function formatElapsed(days: number): string {
  if (days < 1) return "the same day";
  if (days < 14) return `${Math.max(1, Math.round(days))} day${Math.round(days) === 1 ? "" : "s"}`;
  if (days < 60) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? "" : "s"}`;
  return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? "" : "s"}`;
}

// Turns real (time, score) pairs into the same shape the old AI-predicted
// narrative used, so the same card UI can render either - but every number
// here is computed from actual check-ins, not generated.
function computeRealTrend(points: { t: number; score: number }[]): RealTrend | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const totalDays = Math.max(0, (last.t - first.t) / 86_400_000);
  const totalWeeks = totalDays / 7;
  const pctChange = ((last.score - first.score) / Math.max(first.score, 1)) * 100;
  const weeklyDeltaPctRaw = totalWeeks >= 0.5 ? pctChange / totalWeeks : pctChange;
  const weeklyDeltaPct = Math.max(-100, Math.min(100, Math.round(weeklyDeltaPctRaw)));

  const trajectory: TrendKind =
    weeklyDeltaPct > 5 ? "rising" : weeklyDeltaPct >= -5 ? "steady" : weeklyDeltaPct >= -25 ? "cooling" : "nose-diving";

  const range = `over ${formatElapsed(totalDays)}`;
  const checkinsCount = points.length - 1;
  const verdict = `Your vibe score moved from ${first.score} to ${last.score} ${range} - ${checkinsCount} real check-in${checkinsCount === 1 ? "" : "s"}, not a prediction.`;

  return {
    trajectory,
    weeklyDeltaPct,
    range,
    verdict,
    points: points.map((p) => p.score),
    checkinsCount,
  };
}

function RealDecaySparkline({ points }: { points: number[] }) {
  const w = 600;
  const h = 120;
  const pad = 8;
  const n = points.length;

  const xs = points.map((_, i) => (n === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1)));
  const ys = points.map((score) => pad + (1 - Math.max(0, Math.min(100, score)) / 100) * (h - pad * 2));
  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xs[n - 1].toFixed(1)} ${h - pad} L ${xs[0].toFixed(1)} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 100 }}>
      <defs>
        <linearGradient id="real-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--mint)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#real-spark-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--mint)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={4} fill="var(--mint)" />
      ))}
    </svg>
  );
}

function VibeDecayCard({
  reportId,
  predicted,
  real,
}: {
  reportId: string;
  predicted: NonNullable<Report["viral"]>["vibe_decay"] | null;
  real: RealTrend | null;
}) {
  const trajectory = real?.trajectory ?? predicted?.trajectory ?? "steady";
  const weeklyDeltaPct = real?.weeklyDeltaPct ?? predicted?.weekly_delta_pct ?? 0;
  const range = real?.range ?? predicted?.range ?? "";
  const verdict = real?.verdict ?? predicted?.verdict ?? "";

  const Icon = trajectory === "rising" ? TrendingUp : trajectory === "steady" ? Minus : TrendingDown;
  const tone = trajectory === "rising" ? "text-mint" : trajectory === "steady" ? "text-ink/70" : "text-destructive";
  const sign = weeklyDeltaPct > 0 ? "+" : "";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl">Vibe Decay Trajectory</h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${
            real ? "bg-mint-soft text-mint" : "bg-muted text-ink/50"
          }`}
        >
          {real ? "Real" : "AI-predicted"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs uppercase tracking-widest text-ink/60">Weekly change</p>
          <p className={`font-serif mt-2 text-5xl ${tone}`}>{sign}{weeklyDeltaPct}%</p>
          <p className="mt-1 text-xs text-ink/50 capitalize">{trajectory}</p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs uppercase tracking-widest text-ink/60">Window</p>
          <p className="font-serif mt-2 text-3xl">{range}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-muted/30 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-ink/50">
          <span>Trend</span>
          <span>{range}</span>
        </div>
        {real ? (
          <RealDecaySparkline points={real.points} />
        ) : (
          predicted && (
            <DecaySparkline
              trajectory={predicted.trajectory}
              delta={predicted.weekly_delta_pct}
              seed={`${predicted.range}|${predicted.trajectory}|${predicted.weekly_delta_pct}`}
            />
          )
        )}
      </div>

      <p className="mt-4 font-serif text-lg leading-snug text-ink/90">{verdict}</p>

      {!real && (
        <p className="mt-2 text-xs text-ink/50">
          This is an AI estimate from a single snapshot - no repeat data yet.
        </p>
      )}

      <Link
        to="/checkin/$id"
        params={{ id: reportId }}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-muted"
      >
        <History className="h-4 w-4" />
        Track this conversation
      </Link>
    </motion.section>
  );
}
