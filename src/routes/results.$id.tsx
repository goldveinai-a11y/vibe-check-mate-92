import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Lock } from "lucide-react";
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
              Here's the free snapshot of your connection. Unlock the full report to dive into every detail.
            </p>
          </div>

          {/* Interest score circle card */}
          <div className="mt-10 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-10">
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
            <div className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${preview.interest_score}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full bg-pink"
              />
            </div>
            <p className="mt-4 text-sm text-ink/60">
              Based on tone, response times, and engagement patterns detected.
            </p>
          </div>

          {/* Relationship Vibe (free tease) */}
          <div className="mt-5 rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl">Relationship Vibe</h3>
            </div>
            <HealthLine health={preview.conversation_health} />
          </div>

          {/* Unlock section */}
          <div className="mt-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-soft px-4 py-2 text-xs font-medium text-ink/80">
              <Lock className="h-3.5 w-3.5" />
              Premium Insights
            </span>
            <h2 className="font-serif mt-4 text-3xl sm:text-4xl">Unlock the Full Story</h2>
            <p className="mt-3 max-w-md text-sm text-ink/70">
              Four deeper insights are waiting behind the full report.
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

function HealthLine({ health }: { health: "healthy" | "caution" | "toxic" }) {
  const map = {
    healthy: { label: "Warm & connected", color: "bg-mint" },
    caution: { label: "Mixed signals — proceed with care", color: "bg-pink" },
    toxic: { label: "Tense energy detected", color: "bg-destructive" },
  }[health];
  return (
    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "72%" }}
        transition={{ duration: 0.8 }}
        className={`h-full ${map.color}`}
        title={map.label}
      />
    </div>
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