import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Clock, Lock, ShieldCheck } from "lucide-react";
import {
  ARCHETYPES,
  FUNNEL_QUESTIONS,
  INTERSTITIALS,
  archetypeScores,
} from "@/lib/quiz-funnel";
import { trackEvent } from "@/lib/analytics";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// The quiz funnel screen.
//
// Five phases on one route rather than five pages: cover, questions,
// processing, result, offer. Keeping it on one route means no reload
// between steps, which on mobile is the difference between a funnel that
// feels like an app and one that feels like a form.
//
// The offer is embedded in the result rather than living on its own page.
// That is the friction-sensitive pattern, and this audience is as
// friction-sensitive as they come — she is doing this at 1am and any extra
// navigation is an exit.

type Phase = "cover" | "quiz" | "processing" | "result";

export const Route = createFileRoute("/quiz")({
  component: QuizPage,
  head: () => ({
    meta: [
      { title: "Relationship quiz — what is actually going on with him? | VibeCheck" },
      {
        name: "description",
        content:
          "16 questions, 2 minutes, no account. Get the name for the pattern you are living in, why it keeps running, and what happens in the next 10 days if nothing changes.",
      },
    ],
  }),
});

const PROCESSING_STEPS = [
  "Reading your answers",
  "Comparing against known patterns",
  "Checking who carries the conversation",
  "Writing your read",
];

function QuizPage() {
  const [phase, setPhase] = useState<Phase>("cover");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [interstitial, setInterstitial] = useState<string | null>(null);
  const [procStep, setProcStep] = useState(0);
  const startedAt = useRef(Date.now());
  const milestones = useRef<Set<number>>(new Set());

  const total = FUNNEL_QUESTIONS.length;
  const q = FUNNEL_QUESTIONS[index];
  const progress = Math.round(((index + 1) / total) * 100);

  const result = useMemo(() => archetypeScores(answers), [answers]);
  const arch = ARCHETYPES[result.archetype];

  const start = (value?: string) => {
    setPhase("quiz");
    trackEvent("quiz_started", { quiz_id: "relationship_v1" });
    if (value) answer(value);
    window.scrollTo({ top: 0 });
  };

  const answer = (value: string) => {
    const cur = FUNNEL_QUESTIONS[index];
    const next = { ...answers, [cur.id]: value };
    setAnswers(next);
    trackEvent("quiz_question_answered", {
      quiz_id: "relationship_v1",
      question_id: cur.id,
      question_number: index + 1,
      answer_value: value,
    });

    const pct = Math.round(((index + 1) / total) * 100);
    for (const m of [25, 50, 75]) {
      if (pct >= m && !milestones.current.has(m)) {
        milestones.current.add(m);
        trackEvent("quiz_progress_milestone", { quiz_id: "relationship_v1", percent_complete: m });
      }
    }

    const beat = INTERSTITIALS.find((i) => i.after === cur.id);
    if (beat) {
      setInterstitial(beat.id);
      window.scrollTo({ top: 0 });
      return;
    }
    advance(next);
  };

  const advance = (current: Record<string, string>) => {
    if (index + 1 >= total) {
      const seg = archetypeScores(current).archetype;
      trackEvent("quiz_completed", {
        quiz_id: "relationship_v1",
        total_questions: total,
        time_spent_seconds: Math.round((Date.now() - startedAt.current) / 1000),
        segment_result: seg,
      });
      setPhase("processing");
      window.scrollTo({ top: 0 });
      return;
    }
    setIndex(index + 1);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (phase !== "processing") return;
    const t = setInterval(() => setProcStep((s) => s + 1), 1100);
    const done = setTimeout(() => {
      setPhase("result");
      trackEvent("results_page_viewed", {
        quiz_id: "relationship_v1",
        segment_result: result.archetype,
      });
      trackEvent("paywall_viewed", { quiz_id: "relationship_v1", paywall_id: "quiz_embedded" });
    }, 4600);
    return () => {
      clearInterval(t);
      clearTimeout(done);
    };
  }, [phase, result.archetype]);

  // ---- Interstitial -------------------------------------------------------
  if (interstitial) {
    const beat = INTERSTITIALS.find((i) => i.id === interstitial)!;
    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader showUnlock={false} />
        <section className="px-5 pt-14 pb-16">
          <div className="mx-auto max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-pink">
              {beat.eyebrow}
            </p>
            <h2 className="font-serif mt-4 text-[30px] leading-tight sm:text-4xl">{beat.headline}</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/75">{beat.body}</p>
            <button
              type="button"
              onClick={() => {
                setInterstitial(null);
                advance(answers);
              }}
              className="mt-9 w-full rounded-full bg-pink px-6 py-4 text-base font-medium text-white transition hover:opacity-90"
            >
              Keep going
            </button>
          </div>
        </section>
      </main>
    );
  }

  // ---- Processing ---------------------------------------------------------
  if (phase === "processing") {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader showUnlock={false} />
        <section className="px-5 pt-16">
          <div className="mx-auto max-w-md">
            <h2 className="font-serif text-center text-3xl leading-tight">Reading your answers</h2>
            <div className="mt-10 space-y-4">
              {PROCESSING_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <span
                    className={
                      i <= procStep
                        ? "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pink text-white"
                        : "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-border"
                    }
                  >
                    {i <= procStep && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className={i <= procStep ? "text-[15px] text-ink" : "text-[15px] text-ink/40"}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ---- Quiz ---------------------------------------------------------------
  if (phase === "quiz") {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader showUnlock={false} />
        <section className="px-5 pt-6 pb-16">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex(Math.max(0, index - 1))}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/50 transition hover:bg-muted disabled:opacity-30"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-pink transition-all duration-300" style={{ width: progress + "%" }} />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-ink/50">
                {index + 1}/{total}
              </span>
            </div>

            <h1 className="font-serif mt-9 text-[28px] leading-tight sm:text-[34px]">{q.question}</h1>
            {q.subtitle && <p className="mt-2.5 text-[15px] text-ink/55">{q.subtitle}</p>}

            <div className="mt-7 space-y-2.5">
              {q.choices.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => answer(c.value)}
                  className={
                    answers[q.id] === c.value
                      ? "w-full rounded-2xl border-2 border-pink bg-pink-soft/40 px-5 py-4 text-left text-[15px] text-ink"
                      : "w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-left text-[15px] text-ink transition hover:border-pink hover:bg-pink-soft/25"
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-ink/40">
              No account. Nothing posted anywhere.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // ---- Result + embedded offer -------------------------------------------
  if (phase === "result") {
    const echoes = [
      answers.raise === "sorry" || answers.raise === "reversed"
        ? "you said it usually ends with you apologising"
        : null,
      answers.repair === "always-me" || answers.repair === "mostly-me"
        ? "you said you are the one who speaks first afterwards"
        : null,
      answers.unsaid === "list" ? "you said there is a whole list of things you no longer raise" : null,
      answers.stop === "silence" ? "you said that if you stopped texting, it would go quiet" : null,
      answers.others === "hide" ? "you said you have stopped telling people much" : null,
    ].filter(Boolean) as string[];

    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader showUnlock={false} />

        <section className="px-5 pt-8 pb-12">
          <div className="mx-auto max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/45">
              Your read, based on 16 answers
            </p>
            <h1 className="font-serif mt-3 text-[34px] leading-[1.1] sm:text-[42px]">{arch.name}</h1>
            <p className="mt-3 text-lg leading-relaxed text-ink/80">{arch.tagline}</p>

            <div className="mt-7 rounded-3xl border border-border/60 bg-card p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/45">
                What is actually happening
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{arch.mechanism}</p>
            </div>

            {echoes.length > 0 && (
              <div className="mt-4 rounded-3xl border-l-2 border-pink/50 bg-card py-4 pl-5 pr-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/45">
                  Why this one, and not another
                </p>
                <ul className="mt-3 space-y-1.5">
                  {echoes.slice(0, 3).map((e) => (
                    <li key={e} className="text-[15px] leading-relaxed text-ink/75">
                      &mdash; {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-3xl bg-ink p-5 text-cream sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-60">
                What it is costing you
              </p>
              <p className="mt-3 text-[15px] leading-relaxed opacity-95">{arch.cost}</p>
            </div>

            <div className="mt-4 rounded-3xl border-2 border-pink/30 bg-pink-soft/30 p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/50">
                The call — next 10 days
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{arch.prediction}</p>
              <p className="mt-3 text-xs text-ink/50">
                If it does not happen, this read was wrong, and that tells you something too.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-border/60 bg-card px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-ink/70">Match confidence</span>
                <span className="text-sm font-semibold">{result.confidence}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-pink" style={{ width: result.confidence + "%" }} />
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-ink/50">
                Built from what you told us. It goes up once it can read the actual messages.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card px-5 py-14">
          <div className="mx-auto max-w-lg">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              That is the shape of it. Now the part you came for.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/75">
              Naming the pattern is not the same as knowing what to do inside it on a Tuesday night
              when he has gone quiet again. That is what the full thing is for.
            </p>

            <ul className="mt-7 grid gap-2.5">
              {[
                "Paste the actual messages — it reads them, not your summary",
                "It remembers this conversation the next time you open it",
                "Dated calls you can check, and it tells you when it was wrong",
                "The part about what you are doing to keep it running",
                "Answers at 1am, without a friend who has a side",
              ].map((l) => (
                <li key={l} className="flex items-start gap-2 text-[15px] leading-snug text-ink/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
                  {l}
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-2.5">
              <a
                href="/subscribe?plan=trial7"
                onClick={() => trackEvent("plan_selected", { plan: "trial7", surface: "quiz_result", segment_result: result.archetype })}
                className="relative block rounded-2xl border-2 border-pink bg-cream px-5 py-4 transition hover:bg-pink-soft/40"
              >
                <span className="absolute -top-2.5 right-4 rounded-full bg-pink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Most popular
                </span>
                <span className="flex items-baseline justify-between">
                  <span className="text-[15px] font-medium">7 days full access</span>
                  <span className="text-[15px] font-semibold">&euro;1.00</span>
                </span>
                <span className="mt-1 block text-xs text-ink/55">then &euro;29.99/month, cancel anytime</span>
              </a>

              <a
                href="/subscribe?plan=weekly"
                onClick={() => trackEvent("plan_selected", { plan: "weekly", surface: "quiz_result", segment_result: result.archetype })}
                className="block rounded-2xl border border-border/70 bg-cream px-5 py-4 transition hover:bg-muted/40"
              >
                <span className="flex items-baseline justify-between">
                  <span className="text-[15px] font-medium">3 days free</span>
                  <span className="text-[15px] font-semibold">&euro;0.00</span>
                </span>
                <span className="mt-1 block text-xs text-ink/55">then &euro;9.99/week, cancel anytime</span>
              </a>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink/50">
              <ShieldCheck className="h-3.5 w-3.5" /> Cancel any time, in two taps, from your account
            </p>

            <p className="mt-6 text-center text-sm text-ink/55">
              Not now?{" "}
              <Link to="/" hash="chat" className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink">
                Ask it something free first
              </Link>
            </p>
          </div>
        </section>

        <SiteFooter />
      </main>
    );
  }

  // ---- Cover --------------------------------------------------------------
  const first = FUNNEL_QUESTIONS[0];
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-8 pb-14 sm:pt-12">
        <div className="mx-auto max-w-lg">
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
            the internet gives you fifteen signs that fit anyone.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            16 questions. Then the name for the pattern you're living in, why it keeps running, and
            one dated call you can check for yourself.
          </p>

          <p className="mt-9 text-[15px] font-medium">{first.question}</p>
          <div className="mt-4 space-y-2.5">
            {first.choices.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  trackEvent("quiz_cta_clicked", { surface: "cover", answer: c.value });
                  start(c.value);
                }}
                className="group flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card px-5 py-4 text-left text-[15px] shadow-sm transition hover:-translate-y-0.5 hover:border-pink hover:bg-pink-soft/30 hover:shadow-md"
              >
                <span>{c.label}</span>
                <span className="shrink-0 text-ink/25 transition group-hover:text-pink">&rarr;</span>
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-ink/45">
            Free &middot; 12,483 reads unlocked so far
          </p>
        </div>
      </section>

      <section className="bg-card px-5 py-14">
        <div className="mx-auto max-w-lg">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Five patterns, not a score</h2>
          <p className="mt-3 text-base leading-relaxed text-ink/65">
            Your answers land you in one of these. Each one runs differently, costs something
            different, and needs a different thing from you.
          </p>
          <div className="mt-7 space-y-3">
            {Object.values(ARCHETYPES).map((a) => (
              <div key={a.name} className="rounded-2xl border border-border/60 bg-cream px-5 py-4">
                <p className="font-serif text-lg">{a.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/65">{a.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14">
        <div className="mx-auto max-w-lg">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            It won't tell you what you want to hear
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/75">
            If the answer is that he's ordinary and you're anxious, it says that. If the answer is
            that you're the one running the pattern, it says that too, to your face.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/75">
            A read that always agrees with you is worth nothing. You already know what agreement
            sounds like — you came for the other thing.
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
              <p className="text-[15px] font-medium">&ldquo;Who sees this?&rdquo;</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/65">
                Nobody. No account, no posting, nothing kept.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-2.5">
            {first.choices.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  trackEvent("quiz_cta_clicked", { surface: "footer", answer: c.value });
                  start(c.value);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card px-5 py-4 text-left text-[15px] transition hover:border-pink hover:bg-pink-soft/30"
              >
                <span>{c.label}</span>
                <span className="shrink-0 text-ink/25">&rarr;</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
