import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getAnalysisFull } from "@/lib/vibecheck.functions";
import { getAnonId } from "@/lib/anon-id";
import type { Report, Flag } from "@/lib/vibecheck-schema";

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
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-serif text-3xl">Report unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </main>
  ),
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function ReportPage() {
  const { id } = Route.useParams();
  const ownerAnonId = typeof window !== "undefined" ? getAnonId() : "ssr-placeholder-anon-id";
  const { data } = useSuspenseQuery(fullQuery(id, ownerAnonId));

  if ("locked" in data && data.locked) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">Locked</h1>
          <p className="mt-2 text-sm text-muted-foreground">Complete payment to view your full report.</p>
          <Link to="/paywall/$id" params={{ id }} className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground">Unlock</Link>
        </div>
      </main>
    );
  }

  const report = (data as { locked: false; report: Report }).report;

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md px-6 pt-6">
        <Link to="/" className="text-sm text-muted-foreground">← Home</Link>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <h1 className="font-serif text-4xl leading-tight">Your full VibeCheck</h1>
          <p className="mt-2 text-sm text-muted-foreground">Unfiltered. Screenshot it. Share it. Act on it.</p>
        </motion.div>

        <Section title="The scores" delay={0.05}>
          <div className="grid grid-cols-2 gap-3">
            <ScoreTile label="Interest" value={report.interest_score} />
            <ScoreTile label="Emotional investment" value={report.emotional_investment_score} />
            <ScoreTile label="Consistency" value={report.response_consistency} />
            <ScoreTile label="Flirting" value={report.flirting_signals} />
            <ScoreTile label="Toxicity" value={report.toxicity_score} invert />
            <ScoreTile label="Health" text={report.conversation_health} />
          </div>
        </Section>

        <Section title="Hardcore analytics" delay={0.1}>
          <dl className="space-y-3 rounded-3xl bg-card p-5">
            {Object.entries(report.hardcore_analytics).map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{k.replaceAll("_", " ")}</dt>
                <dd className="text-right text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Psychological read" delay={0.15}>
          <div className="space-y-3">
            {Object.entries(report.psychological_analysis).map(([k, v]) => (
              <div key={k} className="rounded-3xl bg-card p-5">
                <p className="text-xs uppercase tracking-widest text-purple">{k.replaceAll("_", " ")}</p>
                <p className="mt-2 text-sm leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={`Green flags · ${report.green_flags.length}`} delay={0.2}>
          <div className="space-y-3">
            {report.green_flags.map((f, i) => <FlagCard key={i} tone="green" flag={f} />)}
          </div>
        </Section>

        <Section title={`Red flags · ${report.red_flags.length}`} delay={0.25}>
          <div className="space-y-3">
            {report.red_flags.map((f, i) => <FlagCard key={i} tone="red" flag={f} />)}
          </div>
        </Section>

        <Section title="Future outlook" delay={0.3}>
          <div className="rounded-3xl bg-gradient-to-br from-purple to-purple-deep p-6 text-white">
            <p className="font-serif text-xl leading-snug">{report.future_outlook}</p>
          </div>
        </Section>

        <div className="mt-10 text-center">
          <Link to="/upload" className="inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground">
            Analyze another chat →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, delay, children }: { title: string; delay?: number; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0 }}
      className="mt-8"
    >
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </motion.section>
  );
}

function ScoreTile({ label, value, text, invert }: { label: string; value?: number; text?: string; invert?: boolean }) {
  const display = text ?? value?.toString() ?? "—";
  const color = value === undefined
    ? "bg-card"
    : invert
      ? value >= 60 ? "bg-destructive/15" : "bg-card"
      : value >= 70 ? "bg-mint/40" : value >= 40 ? "bg-pink-soft" : "bg-destructive/15";
  return (
    <div className={`rounded-3xl p-4 shadow-sm ${color}`}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-serif mt-1 text-3xl">{display}</p>
    </div>
  );
}

function FlagCard({ tone, flag }: { tone: "green" | "red"; flag: Flag }) {
  const isGreen = tone === "green";
  return (
    <div className={`rounded-3xl p-5 ${isGreen ? "bg-mint/40" : "bg-destructive/10"}`}>
      <h4 className="font-serif text-xl leading-tight">{flag.title}</h4>
      <blockquote className="mt-3 border-l-2 border-current pl-3 text-sm italic opacity-80">"{flag.quote}"</blockquote>
      <p className="mt-3 text-sm">{flag.explanation}</p>
    </div>
  );
}