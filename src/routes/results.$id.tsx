import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getAnalysisPreview } from "@/lib/vibecheck.functions";

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
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-serif text-3xl">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/upload" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground">Try again</Link>
      </div>
    </main>
  ),
  notFoundComponent: () => <div className="p-8">Not found</div>,
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
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">The AI couldn't read it</h1>
          <p className="mt-2 text-sm text-muted-foreground">{data.error_message ?? "Try clearer screenshots."}</p>
          <Link to="/upload" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground">Try again</Link>
        </div>
      </main>
    );
  }

  if (data.status !== "ready" || !data.preview_json) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">Still cooking… refresh in a moment.</p>
      </main>
    );
  }

  const preview = data.preview_json as unknown as PreviewJson;

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-6 pt-6">
        <Link to="/" className="text-sm text-muted-foreground">← Home</Link>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif mt-4 text-4xl leading-tight"
        >
          Your free vibe check
        </motion.h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Here's the surface. The full brutal breakdown is one tap away.
        </p>

        <div className="mt-8 space-y-3">
          <ScoreBar label="Their interest" value={preview.interest_score} />
          <ScoreBar label="Emotional investment" value={preview.emotional_investment_score} />
          <ScoreBar label="Response consistency" value={preview.response_consistency} />
          <ScoreBar label="Flirting signals" value={preview.flirting_signals} />
          <ScoreBar label="Toxicity" value={preview.toxicity_score} invert />
        </div>

        <HealthBadge health={preview.conversation_health} />

        {preview.green_flag_preview && (
          <FlagCard tone="green" flag={preview.green_flag_preview} />
        )}
        {preview.red_flag_preview && (
          <FlagCard tone="red" flag={preview.red_flag_preview} />
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mt-6 overflow-hidden rounded-3xl bg-card p-6 shadow-sm"
        >
          <div className="pointer-events-none absolute inset-0 backdrop-blur-md bg-gradient-to-b from-transparent via-card/60 to-card" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple">Locked</p>
            <h3 className="font-serif mt-2 text-2xl">Full psychological profile</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Attachment style · Power dynamic · Response-time analytics · All red & green flags with verbatim quotes · Future outlook
            </p>
          </div>
        </motion.div>

        <div className="mt-8">
          <Link
            to="/paywall/$id"
            params={{ id }}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20"
          >
            Unlock full report
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">From $4.99 · Instant access</p>
        </div>
      </div>
    </main>
  );
}

function ScoreBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const color = invert
    ? value >= 60 ? "bg-destructive" : value >= 30 ? "bg-orange-400" : "bg-mint"
    : value >= 70 ? "bg-mint" : value >= 40 ? "bg-primary" : "bg-destructive";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-serif text-xl">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function HealthBadge({ health }: { health: "healthy" | "caution" | "toxic" }) {
  const map = {
    healthy: { label: "Healthy vibe", color: "bg-mint text-ink", emoji: "🟢" },
    caution: { label: "Proceed with caution", color: "bg-primary text-primary-foreground", emoji: "🟡" },
    toxic: { label: "Toxic energy detected", color: "bg-destructive text-destructive-foreground", emoji: "🔴" },
  }[health];
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`mt-6 flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${map.color}`}
    >
      <span>{map.emoji}</span> {map.label}
    </motion.div>
  );
}

function FlagCard({ tone, flag }: { tone: "green" | "red"; flag: { title: string; quote: string; explanation: string } }) {
  const isGreen = tone === "green";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-6 rounded-3xl p-5 shadow-sm ${isGreen ? "bg-mint/40" : "bg-destructive/10"}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
        <span>{isGreen ? "💚" : "🚩"}</span>
        <span>{isGreen ? "Green flag" : "Red flag"}</span>
      </div>
      <h4 className="font-serif mt-2 text-2xl leading-tight">{flag.title}</h4>
      <blockquote className="mt-3 border-l-2 border-current pl-3 text-sm italic opacity-80">"{flag.quote}"</blockquote>
      <p className="mt-3 text-sm">{flag.explanation}</p>
    </motion.div>
  );
}