import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Clock, Loader2, Lock, Quote, ShieldCheck } from "lucide-react";
import {
  QUIZ_STEP_ONE,
  QUIZ_STEPS_REST,
  SITUATION_DETAIL_STEP,
  SITUATION_OTHER,
  clearQuizDraft,
  isQuizComplete,
  rememberQuizForAnalysis,
  type QuizAnswers,
  type QuizStep,
} from "@/lib/quiz";
import { getAnonId } from "@/lib/anon-id";
import { trackEvent } from "@/lib/analytics";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// The written read, and the page that sells it.
//
// Question one is the call to action rather than a button, because the
// project already learned that: tapping a concrete answer reads as
// answering a question, tapping Start reads as committing to a process.
// Everything below the fold exists to make the tap worth making — and the
// moment she taps, the selling stops and the quiz takes over the screen.

export const Route = createFileRoute("/quiz")({
  component: QuizPage,
  head: () => ({
    meta: [
      { title: "Relationship quiz - is it toxic, or are you overthinking it? | VibeCheck" },
      {
        name: "description",
        content:
          "Six questions, two minutes, no account. Then a written read: every red flag with the quote that proves it, who is doing the work, and what happens in the next ten days if nothing changes.",
      },
    ],
  }),
});

function QuizPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: QuizStep[] = useMemo(() => {
    const wantsDetail = answers.situation === SITUATION_OTHER;
    return wantsDetail
      ? [QUIZ_STEP_ONE, SITUATION_DETAIL_STEP, ...QUIZ_STEPS_REST]
      : [QUIZ_STEP_ONE, ...QUIZ_STEPS_REST];
  }, [answers.situation]);

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const progress = Math.round(((index + 1) / steps.length) * 100);

  const commit = (value: string) => {
    const next = { ...answers, [step.key]: value } as Partial<QuizAnswers>;
    setAnswers(next);
    setText("");
    trackEvent("quiz_step_answered", { step: index + 1, key: step.key });
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    void run(next);
  };

  const startWith = (value: string) => {
    setStarted(true);
    trackEvent("quiz_started", { answer: value });
    commit(value);
    window.scrollTo({ top: 0 });
  };

  const run = async (final: Partial<QuizAnswers>) => {
    if (!isQuizComplete(final)) {
      setError("Something didn't save. Start again from the top.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { createAnalysis, runAnalysis } = await import("@/lib/vibecheck.functions");
      const anonId = getAnonId();
      const created = await createAnalysis({ data: { ownerAnonId: anonId } });
      if (!("id" in created)) {
        throw new Error(created.code === "free_limit_reached" ? "limit" : created.error);
      }
      rememberQuizForAnalysis(created.id, final);
      clearQuizDraft();
      trackEvent("quiz_completed", { steps: steps.length });
      void runAnalysis({ data: { id: created.id, ownerAnonId: anonId, quiz: final } })
        .then(() => trackEvent("analysis_run_returned", { report_id: created.id }))
        .catch((e: unknown) => {
          trackEvent("analysis_run_error", {
            report_id: created.id,
            message: e instanceof Error ? e.message.slice(0, 120) : "unknown",
          });
        });
      trackEvent("analysis_run_started", { report_id: created.id, surface: "quiz" });
      void navigate({ to: "/analyzing/$id", params: { id: created.id } });
    } catch (err) {
      setBusy(false);
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.toLowerCase().includes("limit")
          ? "You've used your free reads on this device."
          : "Couldn't start the read. Try again in a moment.",
      );
    }
  };

  const onText = (e: FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v && !step.optional) return;
    commit(v);
  };

  // Once she has answered the first question the selling is over. Leaving
  // the pitch on screen underneath a live quiz would be asking her to keep
  // reading an argument she has already accepted.
  if (started) {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader showUnlock={false} />
        <section className="px-5 pt-6 pb-16">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={index === 0 || busy}
                onClick={() => setIndex(Math.max(0, index - 1))}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/50 transition hover:bg-muted disabled:opacity-30"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-pink transition-all" style={{ width: progress + "%" }} />
              </div>
              <span className="shrink-0 text-xs text-ink/50">
                {index + 1}/{steps.length}
              </span>
            </div>

            <h1 className="font-serif mt-8 text-[30px] leading-tight sm:text-4xl">{step.question}</h1>

            {step.options ? (
              <div className="mt-7 space-y-2.5">
                {step.options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    disabled={busy}
                    onClick={() => commit(o)}
                    className="w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-left text-[15px] text-ink transition hover:border-pink hover:bg-pink-soft/30 disabled:opacity-40"
                  >
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={onText} className="mt-7">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  maxLength={400}
                  autoFocus
                  placeholder={step.placeholder}
                  className="w-full resize-none rounded-2xl border-2 border-border bg-card px-4 py-3 text-base leading-relaxed text-ink placeholder:text-ink/40 focus:border-pink focus:outline-none"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={busy || (!text.trim() && !step.optional)}
                    className="flex-1 rounded-full bg-pink px-6 py-3.5 text-base font-medium text-white transition disabled:opacity-40"
                  >
                    {isLast ? "Get my read" : "Continue"}
                  </button>
                  {step.optional && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => commit("")}
                      className="rounded-full px-5 py-3.5 text-sm text-ink/55 transition hover:text-ink"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </form>
            )}

            {busy && (
              <p className="mt-6 flex items-center gap-2 text-sm text-ink/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading your answers
              </p>
            )}
            {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

            <p className="mt-10 text-center text-xs text-ink/40">
              No account. Nothing posted anywhere. Your answers are used once.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const OptionList = ({ surface }: { surface: string }) => (
    <div className="mt-6 space-y-2.5">
      {QUIZ_STEP_ONE.options?.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => {
            trackEvent("quiz_cta_clicked", { surface });
            startWith(o);
          }}
          className="group flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card px-5 py-4 text-left text-[15px] text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-pink hover:bg-pink-soft/30 hover:shadow-md"
        >
          <span>{o}</span>
          <span className="shrink-0 text-ink/25 transition group-hover:text-pink">&rarr;</span>
        </button>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-8 pb-14 sm:pt-12">
        <div className="mx-auto max-w-xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-widest text-ink/45">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 2 minutes</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> No account</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Nothing saved</span>
          </div>

          <h1 className="font-serif mt-5 text-[38px] leading-[1.05] sm:text-5xl">
            You already know something is off. You just can't prove it.
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-ink/80">
            Everyone you ask has a side. Your friends want you happy, his friends want him fine, and
            the internet gives you fifteen signs that fit anyone. So you go round again at 1am.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            Six questions. Then a written read that names the pattern, quotes what proves it, and
            makes one dated call you can check for yourself.
          </p>

          <p className="mt-8 text-[15px] font-medium text-ink">{QUIZ_STEP_ONE.question}</p>
          <OptionList surface="hero" />

          <p className="mt-4 text-center text-xs text-ink/45">
            Free to start &middot; 12,483 reads unlocked so far
          </p>
        </div>
      </section>

      <section className="bg-card px-5 py-14 sm:py-16">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            What it actually tells you
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink/65">
            Not a score out of ten and a horoscope. Four things you can act on, and one you probably
            won't enjoy.
          </p>

          <div className="mt-8 space-y-5">
            <div className="rounded-2xl border-l-2 border-pink/50 bg-cream py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium">The name for what he does</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                Not &ldquo;he's toxic&rdquo;. The mechanism &mdash; blame reversal, intermittent
                warmth, the conflict that gets erased by morning &mdash; with the line from your
                thread that shows it.
              </p>
            </div>
            <div className="rounded-2xl border-l-2 border-pink/50 bg-cream py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium">Who is doing the work</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                Countable, not felt: who opens the conversation, who repairs it, how long each of you
                waits. The asymmetry is usually the whole story.
              </p>
            </div>
            <div className="rounded-2xl border-l-2 border-pink/50 bg-cream py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium">A dated call you can check</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                &ldquo;In the next ten days he won't name a specific day.&rdquo; With what would prove
                it wrong. If it's wrong, you'll know that too &mdash; which is the point.
              </p>
            </div>
            <div className="rounded-2xl border-l-2 border-ink/25 bg-cream py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium">The part about you</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                One thing you're doing that keeps it running. Not blame &mdash; mechanism. Most people
                say this is the section they actually needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:py-16">
        <div className="mx-auto max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/45">
            A real read, blurred
          </p>
          <h2 className="font-serif mt-2 text-3xl leading-tight sm:text-4xl">Eleven sections of it</h2>

          <div className="mt-7 rounded-3xl border border-border/60 bg-card p-4 shadow-lg sm:p-5">
            <div className="rounded-2xl bg-destructive/90 p-5 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-90">
                Proceed with caution
              </p>
              <p className="font-serif mt-2 text-2xl">Red Flag Zone</p>
              <p className="mt-1.5 text-sm leading-relaxed opacity-95">
                You're apologising for things you didn't do. That's a pattern, not a rough patch.
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[
                ["Toxicity", "71%"],
                ["Conversation Health", "24%"],
                ["Emotional Warmth", "38%"],
                ["Reciprocity", "29%"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/60 bg-cream px-3.5 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] text-ink/70">{label}</span>
                    <span className="text-sm font-semibold">{value}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-pink" style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-border/60 bg-cream px-4 py-3.5">
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                Red flag
              </span>
              <p className="mt-2 font-serif text-lg">Blame Reversal</p>
              <p className="mt-1.5 flex items-start gap-1.5 select-none text-sm italic text-ink/40 blur-[3px]">
                <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                the exact line from his messages, quoted back to you
              </p>
            </div>

            <div className="mt-3 rounded-2xl border-2 border-dashed border-pink/30 bg-pink-soft/20 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/50">
                The call
              </p>
              <p className="mt-1.5 select-none text-sm text-ink/40 blur-[3px]">
                In the next 10 days he will not name a specific day. If he does, this read was wrong.
              </p>
            </div>

            <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-widest text-ink/35">
              + 8 more sections
            </p>
          </div>

          <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
            {[
              "Every red flag, with the exact quote",
              "Control and manipulation patterns, named",
              "His attachment style, explained",
              "Gottman's Four Horsemen check",
              "Hard numbers: who initiates, reply times",
              "Forecast if nothing changes",
              "Two replies written for you to send",
              "An AI you can keep asking afterwards",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-[15px] leading-snug text-ink/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-card px-5 py-14 sm:py-16">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            It won't tell you what you want to hear
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/75">
            This is the part most people don't expect. If the answer is that he's ordinary and you're
            anxious, it says that. If the answer is that you're the one running the pattern, it says
            that too, and it says it to your face.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/75">
            A read that always agrees with you is worth nothing, because you already know what
            agreement sounds like. You came for the other thing.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-[15px] font-medium">&ldquo;What if I'm just overthinking?&rdquo;</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/65">
                Then that is the finding, and it's the cheapest possible answer to a question that
                has been costing you sleep.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-medium">&ldquo;Do I need screenshots?&rdquo;</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/65">
                No. The six answers are enough for the read. If you want it sharper afterwards, the
                chat reads the actual thread.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-medium">&ldquo;Who sees this?&rdquo;</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/65">
                Nobody. No account, no posting, nothing kept once the read is written.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Two minutes now, instead of another week of guessing
          </h2>
          <p className="mt-4 text-base text-ink/70">{QUIZ_STEP_ONE.question}</p>
          <div className="text-left">
            <OptionList surface="footer" />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-ink/55">
            Already bought one?{" "}
            <Link to="/my-reports" className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink">
              Your reports are here
            </Link>
            . Or{" "}
            <Link to="/example" className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink">
              see a full example first
            </Link>
            .
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
