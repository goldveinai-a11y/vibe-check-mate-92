import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Ear, Eye, HeartCrack } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { IntakeChat } from "@/components/IntakeChat";
import { trackEvent } from "@/lib/analytics";

// The whole attachment-content category answers "why is he like this". That
// question is unanswerable from the outside and, more importantly, it is not
// the one that decides anything. The question that decides something is
// whether the distance closes on its own or only when she closes it — which
// is countable, and which separates deactivation from low interest.

export const Route = createFileRoute("/patterns/avoidant-partner")({
  component: AvoidantPage,
  head: () => ({
    meta: [
      { title: "Avoidant partner, or just not that interested? | VibeCheck" },
      {
        name: "description",
        content:
          "Avoidance and low interest produce identical logs. The one thing that separates them is what happens after you stop closing the distance yourself.",
      },
      { property: "og:title", content: "Avoidant partner, or just not that interested?" },
      {
        property: "og:description",
        content:
          "Hot then cold, space with no return date, plans that get vaguer as they get nearer. Four things you can count instead of guessing at his attachment style.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://vibecheckapp.app/patterns/avoidant-partner" }],
  }),
});

const OPENERS = [
  "He's hot and cold, constantly",
  "He pulls away right after a good week",
  "He says he needs space but never says for how long",
  "I can't tell if he's avoidant or just not interested",
];

const SIGNALS = [
  {
    icon: Ear,
    label: "Sounds like",
    items: [
      "\u201CI\u2019m just not good at this stuff.\u201D",
      "\u201CI need some space\u201D \u2014 with no date attached to it.",
      "\u201CYou\u2019re overthinking it,\u201D said four days after the best week you\u2019ve had.",
    ],
  },
  {
    icon: Eye,
    label: "Looks like",
    items: [
      "The withdrawal arrives after the closest moment, not after a fight.",
      "Plans get vaguer as the date gets nearer.",
      "He reappears at almost exactly the point where you stopped trying.",
    ],
  },
  {
    icon: HeartCrack,
    label: "Feels like",
    items: [
      "Being fascinating on Tuesday and invisible on Friday, with nothing in between.",
      "Turning your own enthusiasm down so it does not scare anything off.",
      "Having a good week and immediately bracing.",
    ],
  },
];

function AvoidantPage() {
  const [seed, setSeed] = useState<string>("");

  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      <section className="px-5 pt-8 pb-14 sm:pt-12 sm:pb-20">
        <article className="mx-auto max-w-2xl">
          <Link to="/patterns" className="text-xs text-ink/50 hover:text-ink">
            &larr; Patterns
          </Link>

          <h1 className="font-serif mt-4 text-[38px] leading-[1.08] sm:text-5xl">
            Avoidant &mdash; or just not that interested?
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-ink/80">
            The behaviour is real: things get close, then he goes quiet. But &ldquo;avoidant&rdquo;
            is a description of behaviour, not something you can diagnose in another person from
            the outside &mdash; and it answers a question that does not decide anything. It tells
            you why he might be doing it. It does not tell you whether it changes.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            Here is the harder fact. Avoidance and low interest produce an identical log. For the
            first several months they look the same from where you are standing. One thing
            separates them, and it is testable: an avoidant pattern usually reappears when the
            pressure drops. Low interest does not reappear at all.
          </p>

          <h2 className="font-serif mt-14 text-3xl leading-tight">The shape of the cycle</h2>

          <div className="mt-6 space-y-4">
            {SIGNALS.map((s) => (
              <div key={s.label} className="rounded-3xl border border-border/60 bg-card p-5 sm:p-6">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink/50">
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {s.items.map((it) => (
                    <li key={it} className="text-[15px] leading-relaxed text-ink/75">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-5 text-base leading-relaxed text-ink/75">
            The timing is the signal. Withdrawal that follows a fight is about the fight.
            Withdrawal that follows the best evening you have had in a month is about the
            closeness, and that is a rhythm rather than a mood.
          </p>

          <h2 className="font-serif mt-14 text-3xl leading-tight">When it is not that</h2>

          <div className="mt-6 space-y-4 rounded-3xl bg-card p-6 sm:p-7">
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">Something actually happened.</span> Withdrawal after a
              death, a diagnosis, or a job going under is a response, not a pattern. The test is
              whether you can name the week it started. If you can, you are looking at an event.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">He is not cycling, he is just low.</span> Avoidance
              oscillates &mdash; approach, then retreat. Someone who has been steadily, evenly
              low-effort since February is not pulling back from closeness. He is at his level,
              and the level is the answer.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">The distance is ordinary and your alarm is loud.</span>{" "}
              If &ldquo;distant&rdquo; means a four-hour reply on a workday, the pattern may be in
              your alarm system rather than his behaviour. Countable version: what is his actual
              median reply time, in hours, over the last two weeks?
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">He told you, and you are hoping it is avoidance.</span>{" "}
              &ldquo;I don&rsquo;t want a relationship&rdquo; is information. Reading it as a
              defence mechanism converts a clear answer into a puzzle, and puzzles have no
              deadline. This is the most expensive mistake on this page.
            </p>
          </div>

          <h2 className="font-serif mt-14 text-3xl leading-tight">Four things you can count</h2>

          <p className="mt-6 text-base leading-relaxed text-ink/75">
            None of these are conversations. They are records, and the third one is the only real
            test on this page.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                How long between the closest moment and the retreat?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Log the last three. If it lands consistently 24 to 72 hours after the good thing,
                you have a rhythm, and rhythms are predictable enough to plan around.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                Who closes the distance?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Take the last five reconnections and note who spoke first. If it is you five times
                out of five, the cycle is not self-correcting. It is being corrected, by you, for
                free.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                Does he come back if you simply stop?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Not as a punishment and not announced &mdash; just stop being the one who
                restarts, for two weeks. If he closes the gap, the withdrawal was about pressure.
                If two weeks pass in silence, you already have your answer and it did not cost you
                a conversation to get it.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                Is the gap getting shorter or longer?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Compare this month to three months ago. Direction tells you more than level does.
                A cycle that is shortening is a person adjusting; one that is lengthening is a
                person leaving slowly.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border-2 border-pink/25 bg-pink-soft/30 p-6 sm:p-7">
            <h3 className="font-serif text-xl leading-snug">What the label costs you</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
              &ldquo;He&rsquo;s avoidant&rdquo; is a comfortable sentence, because it makes the
              distance impersonal and it makes waiting feel like understanding. But an explanation
              has no expiry date, and the behaviour does. So give it one: what would this need to
              look like in eight weeks for you to still want to be in it? Write that down now,
              while you are not in the middle of the good part.
            </p>
          </div>
        </article>
      </section>

      <section className="bg-card px-5 py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Let it read the timing for you
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70">
            Paste screenshots of the thread, or describe it. Timestamps are the part people cannot
            see in their own conversations, and they are the part that answers this.
          </p>

          <div className="mt-9 w-full max-w-lg text-left sm:max-w-2xl lg:max-w-3xl">
            <IntakeChat
              seed={seed}
              onStarted={() =>
                trackEvent("chip_clicked", { surface: "patterns_avoidant", chip_text: seed })
              }
            />
          </div>

          <div className="mt-4 flex w-full max-w-lg flex-wrap justify-center gap-2">
            {OPENERS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setSeed(o)}
                className="rounded-full border border-pink/30 bg-pink-soft/40 px-3.5 py-2 text-[13px] text-ink/80 transition hover:bg-pink-soft disabled:opacity-40"
              >
                {o}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-ink/50">Free to start. No account needed.</p>
        </div>
      </section>

      <section className="px-5 py-14">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border/60 bg-card p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/50">
            Related
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
            If the quiet spells have started to feel like something you have to manage rather than
            wait out, that is a different pattern &mdash;{" "}
            <Link
              to="/patterns/walking-on-eggshells"
              className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
            >
              walking on eggshells
            </Link>{" "}
            covers it. And if you cannot stop checking whether he is pulling away, the checking
            itself may be the thing to look at:{" "}
            <Link
              to="/rocd"
              className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
            >
              relationship OCD
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">
            Where this comes from
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink/60">
            <li>
              Bowlby and Ainsworth on attachment, and Mary Main&rsquo;s later work extending it to
              adults &mdash; where the word avoidant actually comes from.
            </li>
            <li>
              Mikulincer and Shaver on deactivating strategies: distance that increases as
              closeness increases, which is why the timing matters more than the amount.
            </li>
            <li>
              John Gottman on bids for connection and turning away &mdash; a cheaper unit to count
              than an attachment style, and a better predictor.
            </li>
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-ink/55">
            Attachment style is a research construct about populations. Nothing here is a
            diagnosis of a particular person, and it is not meant to be one.
          </p>

          <Link
            to="/patterns"
            className="mt-8 inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-ink"
          >
            More patterns <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
