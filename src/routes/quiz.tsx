import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
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

// The report, as its own thing.
//
// The chat is the product on the homepage; this is the other half — a
// fixed set of questions that ends in the full written read. It used to be
// the whole funnel and then it was a redirect to the homepage for a day,
// which meant the report had no entrance at all.
//
// Deliberately no screenshot step. The old flow asked for screenshots here
// and 83% of people left rather than open their photo library. Screenshots
// belong in the chat, where she has already decided the thing is worth
// talking to. The read runs on the answers alone, and says so.

export const Route = createFileRoute("/quiz")({
  component: QuizPage,
  head: () => ({
    meta: [
      { title: "Get the full read - VibeCheck" },
      {
        name: "description",
        content:
          "Six questions, then a written read of the pattern: every red flag with the quote that proves it, who is doing the work, and what happens if nothing changes.",
      },
    ],
  }),
});

function QuizPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
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

      // Fired without await: the read takes 40-90s and holding the request
      // open for it is what used to make half of all analyses look like
      // failures.
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

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-6 pb-12">
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
              <Loader2 className="h-4 w-4 animate-spin" /> Starting your read
            </p>
          )}
          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
        </div>
      </section>

      <section className="bg-card px-5 py-14 sm:py-16">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-center text-3xl leading-tight sm:text-4xl">
            Here's what you get
          </h2>
          <p className="mt-3 text-center text-base text-ink/65">
            A straight read, with the receipts &mdash; eleven sections of it.
          </p>

          <div className="mt-8 rounded-3xl border border-border/60 bg-cream p-4 shadow-sm sm:p-5">
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
                <div key={label} className="rounded-2xl border border-border/60 bg-card px-3.5 py-3">
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

            <div className="mt-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5">
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                Red flag
              </span>
              <p className="mt-2 font-serif text-lg">Blame Reversal</p>
              <p className="mt-1 select-none text-sm text-ink/40 blur-[3px]">
                the exact quote from his messages
              </p>
            </div>

            <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-widest text-ink/35">
              + 8 more sections
            </p>
          </div>

          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {[
              "Every red flag, with the exact quote",
              "Control and manipulation patterns, named",
              "His attachment style, explained",
              "Gottman's Four Horsemen check",
              "Hard numbers: who initiates, reply times",
              "Forecast if nothing changes",
              "Two replies written for you to send",
              "An AI you can keep asking",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-[15px] leading-snug text-ink/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-sm leading-relaxed text-ink/55">
            Already bought one?{" "}
            <Link to="/my-reports" className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink">
              Your reports are here
            </Link>
            . Or{" "}
            <Link to="/example" className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink">
              see a full example
            </Link>
            .
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
