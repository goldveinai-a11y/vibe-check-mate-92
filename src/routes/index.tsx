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
  FileText,
  Plus,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  // The landing page had no head block at all, so it inherited whatever the
  // root route set - meaning the one page most likely to be shared, linked
  // or indexed had no title or description of its own. Written in the
  // decoder framing rather than the old "compatibility score" one.
  head: () => ({
    meta: [
      { title: "VibeCheck - decode what they actually meant" },
      {
        name: "description",
        content:
          "Six quick questions and an honest read on where you stand: their real interest level, the red flags, and what their messages actually mean. First read free.",
      },
    ],
  }),
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
          {/* "Insights" is what a B2B dashboard sells. What she actually
              wants is a decoder for one specific person's behaviour, so the
              badge says that instead. */}
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI analysis of your real chat
          </span>

          {/* Names the moment instead of the category. The old headline
              ("Is it a match, or just mixed signals?") described what the
              product is about; this describes what she is doing at 1am with
              her phone in her hand, which is the state someone arriving from
              a TikTok ad is actually in. */}
          {/* Angle moved from "he's not texting back" to "is this toxic".
              Search data forced it: every toxic/narcissist/controlling query
              we appeared for got clicked (100% CTR), every "does he like me"
              query got zero - and the toxic side has 10-30x the volume
              ("toxic marriage" 110k/mo vs the low-thousands on crush terms).
              Mild anxiety gets googled once and forgotten; suspecting your
              relationship is bad for you is something people carry for
              months and actively look for help with. */}
          <h1 className="font-serif mt-8 text-[42px] leading-[1.05] sm:text-6xl md:text-7xl">
            Is it toxic — or are you overthinking it?
          </h1>

          {/* Says what this actually IS before the questions start. Without
              this line the page reads as one more magazine quiz: the whole
              story about an AI reading a real conversation was sitting below
              the fold, where 76% of visitors never reached it. */}
          <p className="mt-5 max-w-xl text-base text-ink/70 sm:text-lg">
            An AI reads your actual conversation and names the pattern — control, breadcrumbing, stonewalling —
            with the exact quotes that prove it. Six questions to start. Screenshots optional.
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

          {/* "Private & secure" is what every product claims and nobody
              believes. A specific action - read once, then deleted - is a
              claim that can be checked, and it's the one thing standing
              between a visitor and handing over someone else's private
              messages. The "not required" line matters just as much: it
              removes the barrier entirely rather than reassuring about it. */}
          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-ink/60">
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-mint" />
              Screenshots are read once, then deleted — and they're optional anyway
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
            <p className="mt-3 text-base text-ink/70">
              A straight read, with the receipts - eleven sections of it.
            </p>
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
            </div>

            {/* The mockup stops mid-card on purpose. Without this the
                snippet above reads as the ENTIRE product - two cards and a
                score - which badly undersells a report that runs eight
                more sections. A hard cut plus a count is the clearest way
                to say "this keeps going" without pasting the whole thing
                onto the landing page. */}
            <div className="relative -mt-8 h-16">
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-transparent" />
            </div>
            <p className="-mt-2 text-center text-xs font-medium uppercase tracking-widest text-ink/45">
              + 8 more sections
            </p>
          </div>

          <div className="mt-6 grid gap-x-6 gap-y-2 text-sm text-ink/70 sm:grid-cols-2">
            {[
              "Every red flag, with the exact quote",
              "Their attachment style, explained",
              "Gottman pattern breakdown",
              "Hard numbers: who initiates, reply times",
              "Forecast if nothing changes",
              "Two replies written for you to send",
              "An AI you can ask follow-up questions",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </div>

          <Link
            to="/example"
            onClick={() => trackEvent("cta_clicked", { position: "see_example" })}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-purple/30 bg-purple-soft/50 px-6 py-3.5 text-sm font-medium text-purple-deep transition hover:bg-purple-soft"
          >
            <FileText className="h-4 w-4" />
            See a full example report
          </Link>

          <p className="mt-4 text-center text-xs text-ink/50">
            Example only. Yours is built from your own answers.
          </p>
        </div>
      </section>

      {/* Names the real competitor out loud. It isn't another app - it's the
          group chat, which is free, instant, and emotionally satisfying.
          Pretending that comparison isn't happening doesn't stop her making
          it; the only honest way to win it is to be clear about the one
          thing friends structurally cannot do, which is be neutral about
          someone they've already decided they hate. */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">Why not just ask your friends?</h2>
            <p className="mt-3 text-base text-ink/70">
              Do both. They're just answering a different question.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-border/60">
            <div className="grid grid-cols-2 bg-muted/40 text-xs font-semibold uppercase tracking-widest text-ink/55">
              <div className="px-4 py-3">The group chat</div>
              <div className="border-l border-border/60 px-4 py-3 text-purple-deep">VibeCheck</div>
            </div>
            {[
              ["Tells you what you want to hear", "Tells you what the pattern shows"],
              ["Three friends, four opinions", "One straight answer"],
              ["Only knows your side of it", "Reads the behaviour itself"],
              ["Already decided he's the worst", "No stake in the outcome"],
            ].map(([friends, us]) => (
              <div key={us} className="grid grid-cols-2 border-t border-border/60 text-sm">
                <div className="px-4 py-3.5 text-ink/60">{friends}</div>
                <div className="border-l border-border/60 px-4 py-3.5 font-medium text-ink/85">{us}</div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-center text-base italic text-ink/65">
            Your friends love you. That's exactly why they're the wrong people to ask.
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

      {/* FAQ. Ordered by how much each objection actually blocks a
          purchase, not by how comfortable it is to answer - privacy first,
          because uploading someone else's private messages is the single
          biggest thing standing between a visitor and trying this, and
          "can they find out" is a real fear nobody was addressing anywhere
          on the site. */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-center text-3xl sm:text-4xl">Questions people actually ask</h2>
          <div className="mt-8 divide-y divide-border/50 border-y border-border/50">
            {[
              {
                q: "Is this actually private?",
                a: "Yes, and specifically: your screenshots are read once to build your report, then deleted. They're never stored, never shown to anyone, and never used to train anything. The report itself lives at a link only you have.",
              },
              {
                q: "Can they find out I did this?",
                a: "No. Nothing is sent to anyone, nothing is posted, and the other person is never contacted in any way. This is entirely between you and the page.",
              },
              {
                q: "Do I need screenshots?",
                a: "No. Six questions is enough for a full read. Screenshots make it sharper - we can quote their actual messages and write you a reply that answers what they really said - but plenty of people skip that step and still get something useful.",
              },
              {
                q: "How accurate can it really be?",
                a: "It reads patterns - who initiates, how fast replies come, how effort is distributed, which behaviours match known attachment and conflict patterns. It's very good at that. It cannot read minds, and it only sees what you show it. Treat it as a sharp second opinion, not a verdict.",
              },
              {
                q: "What do I get for free?",
                a: "A complete read: your verdict, interest score, the strongest flag we found, and hard numbers on the dynamic. The full report adds every remaining flag with exact quotes, the psychological breakdown, the forecast, and two replies written for you to send.",
              },
              {
                q: "Am I signing up for a subscription?",
                a: "Only if you choose one. There's a one-time option for a single report, and a subscription for people checking more than one conversation. Subscriptions are managed and cancelled through Stripe, not by emailing us.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <span className="font-medium text-ink">{item.q}</span>
                  <Plus className="h-4 w-4 shrink-0 text-ink/40 transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 pr-8 text-sm leading-relaxed text-ink/70">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-purple-soft px-5 py-16 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">Ready to stop guessing?</h2>
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
