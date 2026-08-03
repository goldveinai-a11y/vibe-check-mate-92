import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { captureRefCode } from "@/lib/anon-id";
import { getUnlockedCount } from "@/lib/vibecheck.functions";
import { QUIZ_STEP_ONE, saveQuizDraft } from "@/lib/quiz";
import {
  Sparkles,
  Heart,
  Lock,
  Upload as UploadIcon,
  Wand2,
  PieChart,
  LineChart,
  MessageCircleHeart,
  Users,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  // Social proof above the fold. The count already existed and was only
  // shown on the results page - i.e. exclusively to people who had already
  // committed. Someone deciding whether to start had no signal that anyone
  // else uses this at all. Non-blocking: if the query hasn't resolved the
  // line simply isn't rendered, so it can never delay the first paint.
  const { data: unlocked } = useQuery({
    queryKey: ["unlocked-count"],
    queryFn: () => getUnlockedCount(),
    staleTime: 60_000,
  });

  useEffect(() => {
    captureRefCode();
  }, []);

  // Answering question 1 here IS starting the quiz - there's no separate
  // "begin" step. Tapping a concrete answer reads as answering a question;
  // tapping a "Start" button reads as committing to a process. With 73% of
  // visitors gone inside 10 seconds, removing that moment of commitment
  // matters more than any wording change on a button.
  const startQuiz = (answer: string) => {
    saveQuizDraft({ situation: answer });
    trackEvent("quiz_started", { situation: answer });
    navigate({ to: "/quiz" });
  };

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      {/* Hero */}
      <section className="px-5 pt-6 pb-14 sm:pt-10 sm:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered relationship insights
          </span>

          {/* Names the moment instead of the category. The old headline
              ("Is it a match, or just mixed signals?") described what the
              product is about; this describes what she is doing at 1am with
              her phone in her hand, which is the state someone arriving from
              a TikTok ad is actually in. */}
          <h1 className="font-serif mt-8 text-[42px] leading-[1.05] sm:text-6xl md:text-7xl">
            Stop re-reading the thread at 1am
          </h1>

          <p className="mt-5 max-w-xl text-base text-ink/70 sm:text-lg">
            Six quick questions and you'll know where you actually stand — no more asking three friends for four
            different opinions.
          </p>

          {unlocked && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint-soft px-4 py-2 text-sm text-ink/70">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              <span className="font-medium text-ink/85">{unlocked.count.toLocaleString("en-US")}</span>
              <span>reads unlocked so far</span>
            </div>
          )}

          {/* Question 1 of the quiz, inline. See startQuiz above for why
              this replaced a "Start Your VibeCheck" button entirely. */}
          <div className="mt-9 w-full max-w-md">
            <p className="text-sm font-medium uppercase tracking-wide text-ink/45">Question 1 of 6</p>
            <h2 className="font-serif mt-2 text-2xl sm:text-3xl">{QUIZ_STEP_ONE.question}</h2>
            <div className="mt-5 grid gap-3">
              {QUIZ_STEP_ONE.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => startQuiz(opt)}
                  className="w-full rounded-2xl border border-border/60 bg-card px-5 py-4 text-left text-base shadow-sm transition hover:border-pink hover:bg-pink-soft/30"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-ink/60">
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-mint" />
              Private &amp; secure — screenshots are never stored or shared
            </span>
            {/* Saying it plainly. The old page never used the word "free"
                anywhere near the entry point, so nothing told a first-time
                visitor she could get a result without paying. */}
            <span className="font-medium text-ink/70">Your first read is free</span>
          </div>

          <div className="mt-10 h-px w-full max-w-md bg-border/70" />
        </div>
      </section>

      {/* A look at the actual output. The page previously described the
          product entirely in prose - not one image of the thing being sold,
          despite the product BEING a visual report. This is a live mockup
          rather than a screenshot so it stays in sync with the real design
          and costs nothing to load. */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">Here's what you get</h2>
            <p className="mt-3 text-base text-ink/70">A straight read, with the receipts.</p>
          </div>

          <div className="mt-8 rounded-3xl border border-border/60 bg-card p-4 shadow-lg sm:p-5">
            <div className="rounded-2xl bg-pink p-5 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
                <Flame className="h-3 w-3" />
                You're doing the work
              </span>
              <h3 className="font-serif mt-3 text-3xl leading-tight">One-Sided Energy</h3>
              <p className="mt-2 text-sm text-white/90">
                The math isn't mathing. Effort and interest are lopsided.
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { label: "Interest", value: 34, tone: "bg-pink" },
                { label: "Reciprocity", value: 28, tone: "bg-pink" },
                { label: "Response Consistency", value: 41, tone: "bg-mint" },
                { label: "Toxicity", value: 22, tone: "bg-destructive" },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-border/60 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink/75">{m.label}</span>
                    <span className="font-serif text-lg">{m.value}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${m.tone}`} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-3 overflow-hidden rounded-2xl border border-destructive/30 p-4">
              <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                Red Flag
              </span>
              <h4 className="font-serif mt-2 text-lg">Breadcrumbing Pattern</h4>
              <p className="mt-1 select-none text-sm italic text-ink/60 blur-[3px]">
                "the exact quote from their messages"
              </p>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-ink/50">
            Example report. Yours is built from your own answers.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">How VibeCheck works</h2>
            <p className="mt-4 text-base text-ink/70">
              About a minute, start to finish.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                Icon: PieChart,
                iconBg: "bg-pink-soft",
                iconColor: "text-pink",
                title: "Answer six questions",
                body: "Who they are to you, who texts first, how fast they reply. Tap through in about thirty seconds.",
              },
              {
                Icon: UploadIcon,
                iconBg: "bg-purple-soft",
                iconColor: "text-purple",
                title: "Add screenshots if you want",
                body: "Optional. With them you get their exact words decoded and a reply to send. Without, you still get a full read.",
              },
              {
                Icon: Wand2,
                iconBg: "bg-pink-soft",
                iconColor: "text-pink",
                title: "Get your read",
                body: "Interest level, red flags, and the honest takeaway on where this is actually going.",
              },
            ].map((s) => (
              <div key={s.title} className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${s.iconBg}`}>
                  <s.Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <h3 className="font-serif mt-5 text-xl">{s.title}</h3>
                <p className="mt-3 text-sm text-ink/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Science, compressed. This used to be two full sections and eight
          large cards - roughly 60% of the page - written in a register that
          reads like a B2B trust page. For a 20-something arriving from
          TikTok that's dead weight in front of the thing she came for. The
          credibility is worth keeping, so it stays; the essay does not. */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep">
              <Brain className="h-3.5 w-3.5" />
              Not vibes-based
            </span>
            <h2 className="font-serif mt-5 text-3xl sm:text-4xl">Built on actual research</h2>
            <p className="mt-3 text-base text-ink/70">
              We read 100+ signals in how you two talk, using frameworks psychologists actually use.
            </p>
          </div>

          <div className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {[
              { Icon: Users, label: "Attachment style", note: "Bowlby & Ainsworth" },
              { Icon: LineChart, label: "Relationship health", note: "Gottman" },
              { Icon: MessageCircleHeart, label: "Conflict & empathy patterns", note: "Rosenberg" },
              { Icon: Sparkles, label: "Hidden emotional signals", note: "Ekman" },
              { Icon: Brain, label: "Personality profile", note: "Big Five" },
              { Icon: Heart, label: "Love language signals", note: "Chapman" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 border-b border-border/40 py-2.5">
                <s.Icon className="h-4 w-4 shrink-0 text-purple-deep" />
                <span className="min-w-0 flex-1 text-sm text-ink/85">{s.label}</span>
                <span className="shrink-0 text-xs text-ink/45">{s.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl">Your privacy comes first</h3>
          </div>

          <ul className="mt-6 space-y-5">
            {[
              { title: "100% Confidential", body: "Your personal chat screenshots are processed securely and are never stored on our servers." },
              { title: "End-to-End Encryption", body: "All uploaded data is encrypted during transit and completely wiped instantly after the analysis is generated." },
              { title: "No Third-Party Sharing", body: "Your data belongs to you. We never sell, share, or use your conversations for AI training." },
            ].map((p) => (
              <li key={p.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint" />
                <p className="min-w-0 text-sm text-ink/80">
                  <span className="font-semibold text-ink">{p.title}</span> — {p.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-purple-soft px-5 py-16 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">Ready to find out where you really stand?</h2>
          <p className="mt-4 text-base text-ink/70">
            Six quick questions. Screenshots optional. Your first read is free.
          </p>
          <Link
            to="/quiz"
            onClick={() => trackEvent("cta_clicked", { position: "footer" })}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-pink px-8 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
          >
            <Heart className="h-4 w-4 fill-white" />
            Start Your VibeCheck
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
