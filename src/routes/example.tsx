import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Heart,
  Flame,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  BarChart3,
  Award,
  Film,
  MessageCircle,
  Brain,
  Sparkles,
  Copy,
  CheckCircle2,
  Quote,
  Share2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { trackEvent } from "@/lib/analytics";

// A complete, unlocked report - the thing people are actually deciding
// whether to pay for. Until now the only way to see one was to buy one,
// and the paywall's six blurred cards asked for trust without showing
// anything. A worked example answers "what do I actually get" far better
// than any list of feature bullets, and it doubles as the one page on the
// site that's genuinely worth indexing and sharing.
//
// Deliberately hardcoded rather than pulled from a real analysis: no
// customer's conversation should ever end up on a public marketing page,
// even anonymised. Everything below is invented, and the page says so.

export const Route = createFileRoute("/example")({
  head: () => ({
    meta: [
      { title: "Example report - a full VibeCheck on a toxic pattern" },
      {
        name: "description",
        content:
          "A complete example VibeCheck report on a blame-shifting partner: toxicity score, every red flag with the exact quotes, the psychology behind it, and what to send back.",
      },
    ],
  }),
  component: ExamplePage,
});

// The example case was rebuilt around a control-and-blame pattern rather
// than the old breadcrumbing-crush one. Not a cosmetic swap: the landing
// page now leads with "Is it toxic - or are you overthinking it?", and a
// sample report whose headline finding was "he's a bit dry over text"
// answered a question nobody arriving from that headline is asking. It
// also under-sold the product - the toxicity work is the strongest thing
// the analysis does and it was represented here by a single 26% bar.
const SCORES = [
  { label: "Interest", value: 52, Icon: Heart, tone: "pink" as const },
  { label: "Reciprocity", value: 29, Icon: Users, tone: "pink" as const },
  { label: "Emotional Warmth", value: 31, Icon: Heart, tone: "pink" as const },
  { label: "Flirting Signals", value: 26, Icon: Flame, tone: "purple" as const },
  { label: "Response Consistency", value: 38, Icon: TrendingUp, tone: "mint" as const },
  { label: "Conversation Health", value: 21, Icon: Activity, tone: "mint" as const },
  { label: "Toxicity Level", value: 74, Icon: AlertTriangle, tone: "danger" as const },
];

const BAR = { pink: "bg-pink", mint: "bg-mint", purple: "bg-purple", danger: "bg-destructive" };
const TEXT = { pink: "text-pink", mint: "text-mint", purple: "text-purple", danger: "text-destructive" };

// Radar axes. Toxicity is inverted (100 - value) so that, as the caption
// under the chart says, higher genuinely is better on every axis - a raw
// toxicity score would point the wrong way and quietly make a bad
// conversation look like a good one.
const SEVEN_AXES = [
  { label: "Interest", value: 52 },
  { label: "Reciprocity", value: 29 },
  { label: "Warmth", value: 31 },
  { label: "Flirting", value: 26 },
  { label: "Consistency", value: 38 },
  { label: "Health", value: 21 },
  { label: "Non-toxic", value: 26 },
];

function pointOnRadar(index: number, ratio: number): string {
  // Start at 12 o'clock and go clockwise, matching the in-app chart.
  const angle = (Math.PI * 2 * index) / SEVEN_AXES.length - Math.PI / 2;
  const radius = 90 * ratio;
  return `${(110 + radius * Math.cos(angle)).toFixed(1)},${(110 + radius * Math.sin(angle)).toFixed(1)}`;
}

function ExamplePage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-4 pb-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-xs font-medium text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Premium Report Unlocked
            </span>
            <br />
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep">
              <Sparkles className="h-3.5 w-3.5" />
              Example report
            </span>
            <h1 className="font-serif mt-5 text-4xl leading-[1.05] sm:text-5xl">
              This is what you actually get
            </h1>
            <p className="mt-4 text-base text-ink/70">
              A full unlocked report, start to finish. Nothing blurred. This one is a made-up eight-month
              relationship where every argument somehow ends with her apologising - yours is built from your own
              conversation.
            </p>
          </div>

          {/* Verdict */}
          <div className="mt-8 rounded-3xl bg-destructive p-6 text-white shadow-lg sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
              <AlertTriangle className="h-3 w-3" />
              Proceed with caution
            </span>
            <h2 className="font-serif mt-3 text-4xl leading-[1.05] sm:text-5xl">Blame Reversal</h2>
            <p className="mt-3 text-base leading-relaxed text-white/90">
              You're not imagining it. Every time you raise something, the conversation turns into your reaction to
              it - and you end up apologising for a thing you didn't do.
            </p>
            <span className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
              74% Toxicity
            </span>
          </div>

          {/* All seven scores, open */}
          <h3 className="font-serif mt-10 text-2xl">Every score, explained</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SCORES.map((m) => (
              <div key={m.label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <m.Icon className={`h-4 w-4 ${TEXT[m.tone]}`} />
                    <span className="text-sm font-medium text-ink/80">{m.label}</span>
                  </div>
                  <span className={`font-serif text-xl ${TEXT[m.tone]}`}>{m.value}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${BAR[m.tone]}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Seven-axis radar, same as the real report. Built inline as SVG
              rather than pulled from the app's chart component, because a
              marketing page shouldn't take a dependency on report internals
              that will keep changing. */}
          <div className="mt-5 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm">
            <h3 className="font-serif text-2xl">The shape of it</h3>
            <svg viewBox="0 0 220 220" className="mx-auto mt-4 h-56 w-56" role="img" aria-label="Seven-axis compatibility radar">
              {[1, 0.75, 0.5, 0.25].map((r) => (
                <polygon
                  key={r}
                  points={SEVEN_AXES.map((_, i) => pointOnRadar(i, r)).join(" ")}
                  fill="none"
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth="1"
                />
              ))}
              <polygon
                points={SEVEN_AXES.map((a, i) => pointOnRadar(i, a.value / 100)).join(" ")}
                className="fill-pink/25 stroke-pink"
                strokeWidth="2"
              />
              {SEVEN_AXES.map((a, i) => {
                const [x, y] = pointOnRadar(i, a.value / 100).split(",").map(Number);
                return <circle key={a.label} cx={x} cy={y} r="3" className="fill-pink" />;
              })}
            </svg>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
              {SEVEN_AXES.map((a) => (
                <div key={a.label} className="flex items-center justify-between gap-2">
                  <span className="truncate text-ink/55">{a.label}</span>
                  <span className="shrink-0 font-medium text-purple-deep">{a.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-ink/55">Higher is better across all seven axes.</p>
          </div>

          {/* Viral keywords */}
          <div className="mt-5 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-pink">
              <Quote className="h-4 w-4" />
              The words moving the needle
            </div>
            <div className="mt-4 space-y-4">
              {[
                {
                  word: "you're overreacting",
                  type: "red" as const,
                  impact:
                    "Four times in three weeks, always within two messages of you naming something concrete. It moves the subject from what he did to how you responded.",
                },
                {
                  word: "I never said that",
                  type: "red" as const,
                  impact:
                    "Used twice about things sitting in the same thread, a few messages up. Whether or not he means it, the effect is that you stop trusting your own memory.",
                },
                {
                  word: "sorry, I was stressed",
                  type: "beige" as "red" | "green" | "beige",
                  impact:
                    "A real apology, and he does mean it in the moment. But it explains the outburst rather than changing it - the same sequence repeats eight days later.",
                },
              ].map((k) => (
                <div key={k.word}>
                  <span
                    className={`font-serif text-2xl ${
                      k.type === "green" ? "text-mint" : k.type === "beige" ? "text-ink/60" : "text-destructive"
                    }`}
                  >
                    "{k.word}"
                  </span>
                  <p className="mt-1 text-sm text-ink/75">{k.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hard numbers */}
          <div className="mt-5 rounded-3xl bg-ink p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
              <BarChart3 className="h-3.5 w-3.5" />
              The receipts
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
              <li>
                You apologised 11 times in this thread. He apologised twice, both after you had already apologised
                first.
              </li>
              <li>
                Every one of the five disagreements followed the same three steps: you name something, he reframes
                it as your reaction, you apologise. Five out of five.
              </li>
              <li>
                Your messages get longer as arguments go on - 18 words, then 44, then 90. That's over-explaining,
                and it usually means you're being asked to justify yourself.
              </li>
              <li>
                He answers a direct question with a question about you in 6 of 9 cases. That's not evasiveness by
                accident; it's consistent enough to be the strategy.
              </li>
              <li>
                <span className="font-medium text-white">Communication style:</span> reactive, blame-externalising,
                affectionate on repair - warmth returns quickly after conflict, which is exactly what makes the
                pattern hard to see from inside it.
              </li>
            </ul>
          </div>

          {/* your_voice_style. One of the very few parts of the report that
              is about HER rather than about him, and it was missing from
              this page entirely - which quietly made the product look like
              it only analyses the other person. */}
          <div className="mt-5 rounded-3xl border border-purple/25 bg-purple-soft/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
              <Brain className="h-4 w-4" />
              Your voice style
            </div>
            <h3 className="font-serif mt-3 text-xl leading-tight">
              Careful, pre-apologetic, and negotiating before you've asked
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              You soften almost every request before it lands - "sorry, I know you're busy", "this is probably
              nothing, but". You explain your feelings in paragraphs and then explain them again. None of that is a
              flaw in you; it's what people learn to do when raising something has been expensive before. It's also
              the clearest evidence in this thread that it has been.
            </p>
          </div>

          {/* Flags */}
          <h3 className="font-serif mt-10 text-2xl">Flags, with the exact quotes</h3>

          <div className="mt-4 rounded-3xl border border-mint/40 bg-mint-soft p-5 shadow-sm">
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Green Flag
            </span>
            <h4 className="font-serif mt-3 text-xl">He does come back</h4>
            <p className="mt-2 text-sm italic text-ink/70">"I hate when we're like this"</p>
            <p className="mt-2 text-sm text-ink/80">
              He never lets a fight sit for days. That's real, and it's why leaving feels wrong - repair is present
              here. Worth being clear-eyed about it though: repair without change is what makes a loop a loop.
            </p>
          </div>

          <div className="mt-3 rounded-3xl border border-mint/40 bg-mint-soft p-5 shadow-sm">
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Green Flag
            </span>
            <h4 className="font-serif mt-3 text-xl">No name-calling, no threats</h4>
            <p className="mt-2 text-sm italic text-ink/70">"I'm not trying to make you feel bad"</p>
            <p className="mt-2 text-sm text-ink/80">
              Nothing in this thread crosses into contempt, insults or intimidation. That matters, and it's why this
              reads as a bad pattern rather than something more serious. It also means the problem is the shape of
              the arguments, not the temperature of them.
            </p>
          </div>

          <div className="mt-3 rounded-3xl border border-destructive/30 bg-card p-5 shadow-sm">
            <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Red Flag
            </span>
            <h4 className="font-serif mt-3 text-xl">The subject becomes your reaction</h4>
            <p className="mt-2 text-sm italic text-ink/70">
              "why do you always turn everything into a thing"
            </p>
            <p className="mt-2 text-sm text-ink/80">
              You raised him cancelling for the third time. Two messages later the conversation is about whether
              you're too sensitive - and it never returns to the cancellation. That switch happens in all five
              disagreements here.
            </p>
          </div>

          <div className="mt-3 rounded-3xl border border-destructive/30 bg-card p-5 shadow-sm">
            <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Red Flag
            </span>
            <h4 className="font-serif mt-3 text-xl">Your memory gets contradicted, in writing</h4>
            <p className="mt-2 text-sm italic text-ink/70">"I never said I'd be there, you assumed"</p>
            <p className="mt-2 text-sm text-ink/80">
              He said it in this thread, on the 14th, at 6:42pm - eleven messages above where he denies it. You
              don't have a memory problem. This is the specific thing that makes people start screenshotting their
              own relationship.
            </p>
          </div>

          {/* Psychology */}
          <div className="mt-5 rounded-3xl border border-purple/20 bg-purple-soft p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
              <Brain className="h-4 w-4" />
              Psychological read
            </div>
            <h4 className="font-serif mt-3 text-xl">DARVO, and it's consistent</h4>
            <p className="mt-2 text-sm text-ink/80">
              Deny, Attack, Reverse Victim and Offender - a sequence first described by Jennifer Freyd. It runs in
              order here: the event is denied, your reaction is attacked, and by the end he is the one who has been
              treated unfairly. Five for five is not a bad week. It's a habit.
            </p>
            <p className="mt-3 text-sm text-ink/80">
              On Gottman's Four Horsemen, two of the four are present: defensiveness in almost every exchange, and
              criticism aimed at who you are ("you always") rather than what happened. Contempt and stonewalling are
              not - which is genuinely the difference between a fixable pattern and a finished one.
            </p>
            <p className="mt-3 text-sm text-ink/80">
              One honest caveat: this reads a conversation, not a person. It can tell you the shape of what happens
              between you. It can't tell you what he intends by it.
            </p>
          </div>

          {/* The replies - the actual tool */}
          <div className="mt-5 rounded-3xl bg-ink p-6 text-white shadow-lg sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <MessageCircle className="h-4 w-4" />
              What to send back
            </div>
            <h3 className="font-serif mt-3 text-2xl leading-tight">Two versions, ready to paste</h3>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Calm</p>
                <div className="mt-2 flex items-start gap-2 rounded-2xl bg-white/10 p-3.5">
                  <p className="min-w-0 flex-1 text-sm leading-relaxed">
                    i'm not upset about how i said it. i'm upset about thursday. can we stay on that one thing
                  </p>
                  <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Firmer</p>
                <div className="mt-2 flex items-start gap-2 rounded-2xl bg-white/10 p-3.5">
                  <p className="min-w-0 flex-1 text-sm leading-relaxed">
                    you did say it - it's still in this chat. i'm not arguing about whether i remember right
                  </p>
                  <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm text-white/60">
              Neither one accuses him of anything or asks him to agree he's toxic - that request never lands. Both
              do the one thing that breaks this loop: refuse the subject change and stay on the original event.
            </p>
          </div>

          {/* The AI chat. Genuinely the most under-sold thing in the whole
              product - it exists, it's good, and it was mentioned nowhere
              in any marketing surface. It's also the answer to the biggest
              objection a one-off report has: "but my situation is more
              specific than that". */}
          <div className="mt-5 rounded-3xl border border-purple/25 bg-purple-soft/40 p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white">
                <Sparkles className="h-5 w-5 text-purple-deep" />
              </div>
              <div>
                <h3 className="font-serif text-2xl leading-tight">Ask About Your Report</h3>
                <p className="text-xs text-ink/55">Follow-up questions, answered from your actual data</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-pink px-4 py-3 text-sm text-white">
                Am I the toxic one here? I do get really worked up.
              </div>
              <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-ink/85 shadow-sm">
                You do escalate - your messages triple in length mid-argument and there's sarcasm in two of them.
                That's real and it's worth owning. But look at the order: in all five disagreements the escalation
                comes after the subject has already been switched to you. That's a response to the pattern, not the
                cause of it. Someone can be reacting badly and still not be the one running the loop.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Am I the problem?", "Is this abuse or just a bad patch?", "What do I say next?", "I'm spiralling"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-purple/25 bg-white px-3.5 py-1.5 text-xs font-medium text-ink/70"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Their type + decay */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
                <Sparkles className="h-4 w-4" />
                Their type in 3 words
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {["defensive", "blame-shifting", "quick to make up"].map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-purple-soft px-4 py-2 text-center font-serif text-lg text-purple-deep"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
                  Vibe decay trajectory
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-ink/50">
                  AI-predicted
                </span>
              </div>
              <div className="mt-4 rounded-2xl bg-muted/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-ink/50">Weekly change</p>
                <p className="font-serif text-4xl leading-none">-5%</p>
                <p className="mt-1 text-xs text-ink/60">Grinding down, not blowing up</p>
              </div>
              <div className="mt-2 rounded-2xl bg-muted/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-ink/50">Loop repeats every</p>
                <p className="font-serif text-2xl leading-tight">8-10 days</p>
              </div>
              <div className="mt-2 rounded-2xl bg-muted/40 p-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-ink/50">
                  <span>Trend</span>
                  <span>5 arguments</span>
                </div>
                <svg viewBox="0 0 120 40" className="mt-2 h-12 w-full" role="img" aria-label="Declining trend line">
                  <polyline
                    points="0,8 24,12 48,15 72,22 96,28 120,34"
                    fill="none"
                    className="stroke-pink"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="mt-3 text-xs text-ink/60">
                Real check-ins replace this estimate as you add them over time.
              </p>
            </div>
          </div>

          {/* Forecast */}
          <div className="mt-5 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-serif text-2xl">If nothing changes</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              This one doesn't fade - it stabilises. The loop already works: he avoids an uncomfortable conversation,
              the fight resolves warmly, and nothing is renegotiated. What changes over the next few months is you:
              the apologies get faster, the requests get smaller, and the list of subjects that feel worth raising
              gets shorter. That's the real cost here, and it's gradual enough to miss.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              The move that tells you most is narrow and boring: pick one small, factual thing and stay on it for
              the whole exchange, without defending your tone. Someone who was being careless will follow you back
              to the point. Someone who needs the subject changed will change it again - and you'll have watched it
              happen on purpose instead of at 2am afterwards.
            </p>
          </div>

          {/* Shareables */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-gradient-to-br from-pink via-purple to-ink p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/80">
                <Award className="h-4 w-4" />
                Vibe Award
              </div>
              <h4 className="font-serif mt-3 text-2xl leading-tight">Undefeated in Arguments He Started</h4>
              <p className="mt-2 text-sm text-white/85">
                Five for five. You've apologised eleven times; he's been wrong zero.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium">
                  <Share2 className="h-3 w-3" />
                  Share to Stories
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium">
                  <Award className="h-3 w-3" />
                  Save as Profile Badge
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-purple/20 bg-purple-soft p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
                <Film className="h-4 w-4" />
                You're Giving...
              </div>
              <h4 className="font-serif mt-3 text-2xl leading-tight">Marianne &amp; Connell</h4>
              <div className="mt-1 text-xs uppercase tracking-widest text-ink/50">from Normal People</div>
              <p className="mt-3 text-sm text-ink/80">
                Two people who genuinely love each other and still can't have one conversation that ends where it
                started.
              </p>
            </div>
          </div>

          {/* The closing beat of the real report. Worth reproducing here
              because it names the actual thing being sold - not advice,
              not a score, but the end of not knowing. */}
          <div className="mt-5 rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mint text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-serif mt-4 text-2xl">Loop closed.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink/70">
              You weren't imagining it, and you weren't being dramatic. Whatever you decide to do next, you're not
              deciding it in the dark.
            </p>
          </div>

          {/* The actions that close out a real report. Included because
              they're part of what someone is buying - the report isn't a
              dead end, it's something you can revisit, compare and share. */}
          <div className="mt-4 flex flex-col gap-2">
            {[
              { Icon: Users, label: "Compare Vibes with a friend" },
              { Icon: Sparkles, label: "Analyze another chat" },
              { Icon: Copy, label: "Send this report to a friend" },
            ].map((a) => (
              <span
                key={a.label}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-card px-5 py-3 text-sm font-medium text-ink/75"
              >
                <a.Icon className="h-4 w-4" />
                {a.label}
              </span>
            ))}
          </div>

          {/* Once the example case is about control and blame rather than a
              crush, a line like this stops being optional. Some fraction of
              people reading a page titled "is it toxic" are in something
              worse than a bad pattern, and a product that scores their
              relationship and then says nothing is quietly pretending it
              can't tell the difference. It also costs nothing in
              conversion - being the one product in the category that says
              "this isn't therapy" is a trust asset, not a leak. */}
          <div className="mt-5 rounded-3xl border border-border/60 bg-muted/30 p-5">
            <p className="text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink">One thing this isn't.</span> A report reads a conversation - it
              isn't therapy and it isn't a safety assessment. If you're being threatened, frightened, controlled
              financially or physically, that's past what any analysis is for, and a domestic abuse helpline in your
              country is the right call rather than an app.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-10 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-8">
            <h3 className="font-serif text-2xl sm:text-3xl">Now do yours</h3>
            <p className="mt-2 text-sm text-ink/70">
              Start the conversation. Screenshots optional. Your first read is free.
            </p>
            <Link
              to="/quiz"
              onClick={() => trackEvent("cta_clicked", { position: "example_report" })}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
            >
              <Heart className="h-4 w-4 fill-white" />
              Start my VibeCheck
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-ink/45">
            Example only. The conversation above is invented - no real user's messages appear on this page.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
