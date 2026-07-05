import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Lock, Heart, Flame, MessageCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { getAnalysisPreview } from "@/lib/vibecheck.functions";
import { SiteHeader } from "@/components/SiteHeader";

const previewQuery = (id: string) =>
  queryOptions({
    queryKey: ["analysis-preview", id],
    queryFn: () => getAnalysisPreview({ data: { id } }),
  });

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Your vibe check — free preview" },
      { name: "description", content: "Free preview of your AI chat breakdown." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params, context }) => context.queryClient.ensureQueryData(previewQuery(params.id)),
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

type PreviewJson = {
  interest_score: number;
  emotional_investment_score: number;
  response_consistency: number;
  flirting_signals: number;
  toxicity_score: number;
  conversation_health: "healthy" | "caution" | "toxic";
  green_flag_preview: { title: string; quote: string; explanation: string } | null;
  red_flag_preview: { title: string; quote: string; explanation: string } | null;
};

function computeVerdict(p: PreviewJson) {
  const { interest_score: i, flirting_signals: f, toxicity_score: t, conversation_health: h } = p;
  if (t >= 60 || h === "toxic") return { title: "Red Flag Zone", tag: "Proceed with caution", tone: "danger" as const, blurb: "There's tension under the surface — the vibe is off in ways worth naming out loud." };
  if (i >= 75 && f >= 60) return { title: "Mutual Crush", tag: "It's giving main character energy", tone: "hot" as const, blurb: "Warm, playful energy flowing both ways. You two mirror each other's enthusiasm and keep the conversation alive with genuine curiosity." };
  if (i >= 70) return { title: "Warming Up", tag: "The spark is real", tone: "warm" as const, blurb: "They're leaning in. Real interest, real engagement — this one has legs if you keep the momentum." };
  if (i >= 50 && h === "caution") return { title: "Mixed Signals", tag: "It's… complicated", tone: "caution" as const, blurb: "Some warmth, some distance. There's a pattern here you'll want to see before you invest more." };
  if (i < 45) return { title: "One-Sided Energy", tag: "You're doing the work", tone: "cold" as const, blurb: "The math isn't mathing. Effort and interest are lopsided — the full report shows exactly where." };
  return { title: "Steady Vibes", tag: "Low-key promising", tone: "neutral" as const, blurb: "Nothing electric yet, nothing broken. There's a slow-burn possibility here worth reading closer." };
}

const VERDICT_STYLES = {
  hot: { bg: "bg-pink", chip: "bg-pink-soft text-pink", icon: Flame },
  warm: { bg: "bg-pink", chip: "bg-pink-soft text-pink", icon: Heart },
  caution: { bg: "bg-purple", chip: "bg-purple-soft text-purple", icon: Sparkles },
  neutral: { bg: "bg-mint", chip: "bg-mint-soft text-ink/80", icon: Sparkles },
  cold: { bg: "bg-ink/70", chip: "bg-muted text-ink/70", icon: MessageCircle },
  danger: { bg: "bg-destructive", chip: "bg-destructive/10 text-destructive", icon: AlertTriangle },
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

  if (data.status === "failed") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">The AI couldn't read it</h1>
          <p className="mt-2 text-sm text-ink/60">{data.error_message ?? "Try clearer screenshots."}</p>
          <Link to="/upload" className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-white">Try again</Link>
        </div>
      </main>
    );
  }

  if (data.status !== "ready" || !data.preview_json) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <p className="text-sm text-ink/60">Still analyzing… refresh in a moment.</p>
      </main>
    );
  }

  const preview = data.preview_json as unknown as PreviewJson;
  const verdict = computeVerdict(preview);
  const V = VERDICT_STYLES[verdict.tone];

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
              Here's a taste of what we found. The full report goes way deeper — with exact quotes, red flags, and a forecast.
            </p>
          </div>

          {/* Headline Verdict */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 overflow-hidden rounded-3xl ${V.bg} p-6 text-white shadow-lg sm:p-8`}
          >
            <span className={`inline-flex items-center gap-2 rounded-full ${V.chip} px-3 py-1 text-[11px] font-semibold uppercase tracking-widest`}>
              <V.icon className="h-3.5 w-3.5" />
              {verdict.tag}
            </span>
            <h2 className="font-serif mt-4 text-4xl leading-[1.05] sm:text-5xl">{verdict.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-white/90">{verdict.blurb}</p>
          </motion.div>

          {/* Interest score circle card */}
          <div className="mt-5 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-10">
            <h2 className="font-serif text-2xl sm:text-3xl">Interest Score</h2>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mx-auto mt-6 grid h-40 w-40 place-items-center rounded-full bg-pink text-white sm:h-48 sm:w-48"
            >
              <div className="text-center">
                <div className="font-serif text-5xl leading-none sm:text-6xl">{preview.interest_score}%</div>
                <div className="mt-1 text-xs uppercase tracking-widest">Interest Level</div>
              </div>
            </motion.div>
            <p className="mt-4 text-sm text-ink/60">
              How invested they are, based on tone, response times, and engagement.
            </p>
          </div>

          {/* Score breakdown */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ScoreBar label="Emotional Investment" value={preview.emotional_investment_score} Icon={Heart} tone="pink" />
            <ScoreBar label="Flirting Signals" value={preview.flirting_signals} Icon={Flame} tone="purple" />
            <ScoreBar label="Response Consistency" value={preview.response_consistency} Icon={TrendingUp} tone="mint" />
            <ScoreBar label="Toxicity Level" value={preview.toxicity_score} Icon={AlertTriangle} tone="danger" />
          </div>

          {/* Teaser: one flag revealed, one hidden */}
          {preview.green_flag_preview && (
            <div className="mt-5 rounded-3xl border border-mint/40 bg-mint-soft p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Green Flag</span>
                <span className="text-xs text-ink/60">1 of {5}+ found</span>
              </div>
              <h4 className="font-serif mt-3 text-xl">{preview.green_flag_preview.title}</h4>
              <p className="mt-2 text-sm italic text-ink/70">"{preview.green_flag_preview.quote}"</p>
            </div>
          )}
          {preview.red_flag_preview && (
            <div className="mt-3 relative overflow-hidden rounded-3xl border border-destructive/30 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Red Flag</span>
                <span className="text-xs text-ink/60">Unlock to reveal</span>
              </div>
              <h4 className="font-serif mt-3 text-xl blur-sm select-none">{preview.red_flag_preview.title}</h4>
              <p className="mt-2 text-sm italic text-ink/70 blur-sm select-none">"{preview.red_flag_preview.quote}"</p>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/85 to-transparent" />
            </div>
          )}

          {/* Unlock section */}
          <div className="mt-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-soft px-4 py-2 text-xs font-medium text-ink/80">
              <Lock className="h-3.5 w-3.5" />
              Premium Insights
            </span>
            <h2 className="font-serif mt-4 text-3xl sm:text-4xl">Unlock the Full Story</h2>
            <p className="mt-3 max-w-md text-sm text-ink/70">
              Every red flag, exact-quote receipts, psychological breakdown, and a forecast of where this is headed.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <LockedCard title="Compatibility Breakdown" items={["Communication • 88%", "Emotional sync • 74%", "Shared humor • 91%"]} />
            <LockedCard title="Red & Green Flags" items={["Consistent replies detected", "Occasional mixed signals", "Strong reciprocity"]} />
            <LockedCard title="Conversation Tone" items={["Warm & Flirty energy", "Playful banter throughout", "Rarely tense or cold"]} />
            <LockedCard title="Future Outlook" items={["Positive momentum ahead", "Suggested next steps", "Long-term potential score"]} />
          </div>

          <div className="mt-10">
            <Link
              to="/paywall/$id"
              params={{ id }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
            >
              <Lock className="h-4 w-4" />
              Unlock Full Report
            </Link>
            <p className="mt-3 text-center text-xs text-ink/60">
              One-time payment · Instant access · Your screenshots are never stored.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function LockedCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-soft text-ink/70">
          <Lock className="h-4 w-4" />
        </div>
        <h4 className="font-serif text-lg">{title}</h4>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-ink/70">
        {items.map((it) => (
          <li key={it} className="truncate">{it}</li>
        ))}
      </ul>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/85 to-transparent" />
    </div>
  );
}