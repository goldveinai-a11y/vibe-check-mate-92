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
      { title: "Example report - see a full VibeCheck" },
      {
        name: "description",
        content:
          "A complete example VibeCheck report: interest score, every red flag with receipts, attachment style, forecast, and the exact replies to send.",
      },
    ],
  }),
  component: ExamplePage,
});

const SCORES = [
  { label: "Interest", value: 34, Icon: Heart, tone: "pink" as const },
  { label: "Reciprocity", value: 28, Icon: Users, tone: "pink" as const },
  { label: "Emotional Warmth", value: 41, Icon: Heart, tone: "pink" as const },
  { label: "Flirting Signals", value: 37, Icon: Flame, tone: "purple" as const },
  { label: "Response Consistency", value: 22, Icon: TrendingUp, tone: "mint" as const },
  { label: "Conversation Health", value: 39, Icon: Activity, tone: "mint" as const },
  { label: "Toxicity Level", value: 26, Icon: AlertTriangle, tone: "danger" as const },
];

const BAR = { pink: "bg-pink", mint: "bg-mint", purple: "bg-purple", danger: "bg-destructive" };
const TEXT = { pink: "text-pink", mint: "text-mint", purple: "text-purple", danger: "text-destructive" };

function ExamplePage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-4 pb-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep">
              <Sparkles className="h-3.5 w-3.5" />
              Example report
            </span>
            <h1 className="font-serif mt-5 text-4xl leading-[1.05] sm:text-5xl">
              This is what you actually get
            </h1>
            <p className="mt-4 text-base text-ink/70">
              A full unlocked report, start to finish. Nothing blurred. Made-up conversation - yours is built from
              your own answers and screenshots.
            </p>
          </div>

          {/* Verdict */}
          <div className="mt-8 rounded-3xl bg-pink p-6 text-white shadow-lg sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
              <Flame className="h-3 w-3" />
              You're doing the work
            </span>
            <h2 className="font-serif mt-3 text-4xl leading-[1.05] sm:text-5xl">One-Sided Energy</h2>
            <p className="mt-3 text-base leading-relaxed text-white/90">
              The math isn't mathing. You're carrying this thread almost single-handedly, and Jake is doing just
              enough to keep it from ending.
            </p>
            <span className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
              33% Overall Vibe
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

          {/* Hard numbers */}
          <div className="mt-5 rounded-3xl bg-ink p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
              <BarChart3 className="h-3.5 w-3.5" />
              The receipts
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
              <li>
                Out of the last 18 messages, you opened the conversation 14 times. Jake opened it twice, both times
                after 11pm.
              </li>
              <li>
                Your average message runs 24 words. His run 6. That gap has widened every week since you started
                talking.
              </li>
              <li>
                Reply time went from under 10 minutes in week one to a median of 7 hours now - with two stretches
                over 24 hours.
              </li>
              <li>
                He asks a follow-up question in 11% of his replies. Above 40% is what genuine curiosity usually
                looks like.
              </li>
            </ul>
          </div>

          {/* Flags */}
          <h3 className="font-serif mt-10 text-2xl">Flags, with the exact quotes</h3>

          <div className="mt-4 rounded-3xl border border-mint/40 bg-mint-soft p-5 shadow-sm">
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Green Flag
            </span>
            <h4 className="font-serif mt-3 text-xl">He remembers the small stuff</h4>
            <p className="mt-2 text-sm italic text-ink/70">"how'd the thing with your boss go"</p>
            <p className="mt-2 text-sm text-ink/80">
              Unprompted callback to something you mentioned four days earlier. Low effort to send, but it means he
              retained it - a genuinely good sign in an otherwise thin thread.
            </p>
          </div>

          <div className="mt-3 rounded-3xl border border-destructive/30 bg-card p-5 shadow-sm">
            <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Red Flag
            </span>
            <h4 className="font-serif mt-3 text-xl">Plans that never get a date</h4>
            <p className="mt-2 text-sm italic text-ink/70">"we should definitely do that sometime"</p>
            <p className="mt-2 text-sm text-ink/80">
              Third time this exact structure appears - enthusiasm plus no date. Someone who wants to see you names
              a day. "Sometime" is a way to sound willing while committing to nothing.
            </p>
          </div>

          <div className="mt-3 rounded-3xl border border-destructive/30 bg-card p-5 shadow-sm">
            <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Red Flag
            </span>
            <h4 className="font-serif mt-3 text-xl">Warmth that arrives only late at night</h4>
            <p className="mt-2 text-sm italic text-ink/70">"miss talking to you tbh"</p>
            <p className="mt-2 text-sm text-ink/80">
              Both of his warmest messages landed after 11pm, and neither was followed up the next morning. Affection
              that only shows up at that hour is usually about his mood, not about you.
            </p>
          </div>

          {/* Psychology */}
          <div className="mt-5 rounded-3xl border border-purple/20 bg-purple-soft p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
              <Brain className="h-4 w-4" />
              Psychological read
            </div>
            <h4 className="font-serif mt-3 text-xl">Avoidant attachment, fairly textbook</h4>
            <p className="mt-2 text-sm text-ink/80">
              Warmth that spikes then withdraws, vague future-talk, and consistent under-matching of your effort.
              Under Bowlby and Ainsworth's framework this reads as avoidant: closeness is welcome right up until it
              implies obligation, at which point distance re-appears.
            </p>
            <p className="mt-3 text-sm text-ink/80">
              On Gottman's Four Horsemen there's no contempt or criticism here - the issue is stonewalling. Direct
              questions about plans get answered around rather than answered.
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
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Warm</p>
                <div className="mt-2 flex items-start gap-2 rounded-2xl bg-white/10 p-3.5">
                  <p className="min-w-0 flex-1 text-sm leading-relaxed">
                    ok but "sometime" is doing a lot of work there. free thursday?
                  </p>
                  <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Pulled back</p>
                <div className="mt-2 flex items-start gap-2 rounded-2xl bg-white/10 p-3.5">
                  <p className="min-w-0 flex-1 text-sm leading-relaxed">
                    haha sounds good - let me know when you actually want to make it happen
                  </p>
                  <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm text-white/60">
              Both name the pattern without accusing him of anything. The first hands him one easy way to prove
              you wrong; the second hands the effort back and stops there.
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
                Am I overthinking this, or is my read fair?
              </div>
              <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-ink/85 shadow-sm">
                Your read is fair - it's literally in the data. You sent 9 of 13 messages (69%), and they've never
                once asked you a follow-up question or brought up a topic. So it's less "do they like me" and more
                "they like me, but I'm carrying this entire conversation." That gap burns people out in 4-6 weeks
                if it doesn't shift.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Suggest a reply", "Do they like me?", "What happens next?", "I'm spiralling"].map((chip) => (
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
                {["affectionate", "conversationally passive", "emoji-fluent"].map((w) => (
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
                <p className="font-serif text-4xl leading-none">-8%</p>
                <p className="mt-1 text-xs text-ink/60">Cooling</p>
              </div>
              <div className="mt-2 rounded-2xl bg-muted/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-ink/50">Window</p>
                <p className="font-serif text-2xl leading-tight">3-5 weeks</p>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div className="mt-5 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-serif text-2xl">If nothing changes</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              This doesn't end in a blow-up - it ends in a slow fade, probably over the next three to five weeks.
              The pattern is stable and it works for him exactly as it is, which means he has no reason to change
              it while you keep carrying the thread. The single move that would tell you everything is to stop
              opening the conversation for a week and see whether it survives. If he closes the gap, you had a busy
              person. If it goes quiet, you had your answer already and were being generous about it.
            </p>
          </div>

          {/* Shareables */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-gradient-to-br from-pink via-purple to-ink p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/80">
                <Award className="h-4 w-4" />
                Vibe Award
              </div>
              <h4 className="font-serif mt-3 text-2xl leading-tight">Gold Medalist in Dry Texting</h4>
              <p className="mt-2 text-sm text-white/85">
                Six words per message and somehow still keeping you up at night.
              </p>
            </div>
            <div className="rounded-3xl border border-purple/20 bg-purple-soft p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
                <Film className="h-4 w-4" />
                You're Giving...
              </div>
              <h4 className="font-serif mt-3 text-2xl leading-tight">Marianne &amp; Connell</h4>
              <div className="mt-1 text-xs uppercase tracking-widest text-ink/50">from Normal People</div>
              <p className="mt-3 text-sm text-ink/80">
                One person always reaching, one always retreating, both pretending that's just how it is.
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
              You know exactly where you stand. Whatever happens next, you're not walking in blind anymore.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-10 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-8">
            <h3 className="font-serif text-2xl sm:text-3xl">Now do yours</h3>
            <p className="mt-2 text-sm text-ink/70">
              Six quick questions. Screenshots optional. Your first read is free.
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
