import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Heart, Flag as FlagIcon, MessageCircle, Bell, Star, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { getAnalysisFull } from "@/lib/vibecheck.functions";
import { getAnonId } from "@/lib/anon-id";
import type { Report, Flag } from "@/lib/vibecheck-schema";
import { SiteHeader } from "@/components/SiteHeader";

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

  const report = (data as { locked: false; report: Report }).report;

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
              Here's the deep dive into your connection — compatibility, flags, tone, and where things might be headed.
            </p>
          </div>

          <div className="mt-10 space-y-5">
            <ReportSection Icon={Heart} title="Compatibility Breakdown">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatLine label="Interest" value={report.scores.interest_score} />
                <StatLine label="Reciprocity" value={report.scores.reciprocity_score} />
                <StatLine label="Emotional warmth" value={report.scores.emotional_warmth} />
                <StatLine label="Response consistency" value={report.scores.response_consistency} />
                <StatLine label="Flirting signals" value={report.scores.flirting_signals} />
                <StatLine label="Toxicity" value={report.scores.toxicity_score} invert />
                <StatLine label="Conversation health" value={report.scores.conversation_health} />
              </div>
            </ReportSection>

            <ReportSection Icon={MessageCircle} title="Hardcore Analytics">
              <div className="space-y-3">
                {([
                  ["Initiative", report.hardcore_analytics.initiative_stat],
                  ["Engagement", report.hardcore_analytics.engagement_stat],
                  ["Timeline shifts", report.hardcore_analytics.timeline_changes],
                  ["Communication style", report.hardcore_analytics.communication_style],
                ] as const).map(([label, val]) => (
                  <div key={label} className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs uppercase tracking-widest text-purple">{label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/85">{val}</p>
                  </div>
                ))}
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
              <div className="space-y-3">
                <div className="rounded-2xl bg-purple-soft/60 p-4">
                  <p className="text-xs uppercase tracking-widest text-purple-deep">Attachment style prediction</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/85">{report.psychological_analysis.attachment_style_prediction}</p>
                </div>
                <div className="rounded-2xl bg-pink-soft p-4">
                  <p className="text-xs uppercase tracking-widest text-pink">Gottman patterns</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/85">{report.psychological_analysis.gottman_patterns}</p>
                </div>
              </div>
            </ReportSection>

            <ReportSection Icon={Bell} title="Future Outlook">
              <p className="font-serif text-lg leading-snug text-ink/90">{report.future_outlook}</p>
            </ReportSection>

            <div className="rounded-3xl bg-pink p-6 shadow-md sm:p-8">
              <div className="flex items-center gap-3 text-ink">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink-soft">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-2xl">The Verdict</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink/90">{report.hardcore_analytics.communication_style}</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-ink shadow-sm transition hover:bg-muted"
            >
              <Sparkles className="h-4 w-4" />
              Analyze Another Chat
            </Link>
          </div>
        </div>
      </section>
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

function StatLine({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const color = invert
    ? value >= 60 ? "bg-destructive" : "bg-mint"
    : value >= 70 ? "bg-mint" : value >= 40 ? "bg-pink" : "bg-destructive";
  return (
    <div className="rounded-2xl bg-muted/40 p-4">
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <span className="min-w-0 truncate text-sm text-ink/80">{label}</span>
        <span className="font-serif text-2xl">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} className={`h-full ${color}`} />
      </div>
    </div>
  );
}

function FlagRow({ tone, flag }: { tone: "green" | "red"; flag: Flag }) {
  const isGreen = tone === "green";
  return (
    <div className={`rounded-2xl p-4 ${isGreen ? "bg-mint-soft" : "bg-destructive/10"}`}>
      <h4 className="font-serif text-lg leading-tight">{flag.title}</h4>
      <blockquote className="mt-2 border-l-2 border-current pl-3 text-sm italic opacity-80">"{flag.quote}"</blockquote>
      <p className="mt-2 text-sm text-ink/80">{flag.explanation}</p>
    </div>
  );
}