import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Ear, Eye, HeartCrack } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { IntakeChat } from "@/components/IntakeChat";
import { trackEvent } from "@/lib/analytics";

// "Am I the toxic one?" - the first article in /patterns.
//
// Picked first out of the seven topics for one reason: it is the only one
// where answering honestly is commercially uncomfortable, which is exactly
// why the competition is soft. Every page on this query reassures. The
// honest answer is that the question has three different people behind it
// and they need three different answers, and one of those answers is yes.
//
// The section that does the work is "When it is NOT that". Every list of
// red flags on the internet is written so that everybody recognises
// themselves, because recognition drives sharing. That is also why those
// lists are useless to the person actually asking.

export const Route = createFileRoute("/patterns/am-i-the-toxic-one")({
  head: () => ({
    meta: [
      { title: "Am I the toxic one? A straight answer | VibeCheck" },
      {
        name: "description",
        content:
          "Three different people ask this and only one of them is right. How to tell which one you are - including the signs that you are not, and the ones that mean you are.",
      },
      { property: "og:title", content: "Am I the toxic one? A straight answer" },
      {
        property: "og:description",
        content:
          "The question has three different people behind it. Here is how to tell which one is asking.",
      },
      { property: "og:url", content: "https://vibecheckapp.app/patterns/am-i-the-toxic-one" },
    ],
    links: [{ rel: "canonical", href: "https://vibecheckapp.app/patterns/am-i-the-toxic-one" }],
  }),
  component: ToxicOnePage,
});

const OPENERS = [
  "I think I might be the problem",
  "He says I overreact to everything",
  "I go through his phone and I hate that I do",
  "We both say awful things when we fight",
];

const SIGNALS = [
  {
    Icon: Ear,
    label: "Sounds like",
    items: [
      "\u201CYou\u2019re too sensitive\u201D said back to you often enough that you started using it about yourself",
      "\u201CI only did it because you made me\u201D - from either of you",
      "\u201CWhy do you always turn this into something\u201D",
    ],
  },
  {
    Icon: Eye,
    label: "Looks like",
    items: [
      "Checking a phone, a location, a following list - and knowing it is not okay while doing it",
      "Bringing up something from two years ago in an argument about tonight",
      "One of you leaving the room, the house, or the conversation whenever it gets hard",
    ],
  },
  {
    Icon: HeartCrack,
    label: "Feels like",
    items: [
      "Relief when they are out, then panic about where they are",
      "Rehearsing what you will say for hours before saying it",
      "Not recognising the version of yourself that showed up in that fight",
    ],
  },
];

function ToxicOnePage() {
  const [seed, setSeed] = useState<string | undefined>();

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      <article className="px-5 pt-8 pb-14 sm:pt-12 sm:pb-20">
        <div className="mx-auto max-w-2xl">
          <Link to="/patterns" className="text-xs text-ink/50 hover:text-ink">
            &larr; Patterns
          </Link>

          <h1 className="font-serif mt-4 text-[38px] leading-[1.08] sm:text-5xl">Am I the toxic one?</h1>

          {/* Block 1: the direct answer, inside 100 words. For the snippet,
              and for the person who is scared and will not read an intro. */}
          <p className="mt-6 text-lg leading-relaxed text-ink/80">
            Usually not - but not for the comforting reason. Three different people ask this question. The one who
            is genuinely harming someone rarely asks it at all; they are busy explaining why it was deserved. The
            one who asks constantly is usually being told they are the problem by someone who benefits from that.
            And a third person asks because something real happened and they already know the answer.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            Which one you are is answerable. It has nothing to do with how bad you feel.
          </p>

          {/* Block 2: sounds / looks / feels. Structure borrowed from
              Women's Aid, wording our own - three modalities make a pattern
              recognisable far faster than a flat list of adjectives. */}
          <h2 className="font-serif mt-14 text-3xl leading-tight">What it actually looks like</h2>
          <div className="mt-6 space-y-4">
            {SIGNALS.map((g) => (
              <div key={g.label} className="rounded-3xl border border-border/60 bg-card p-5 sm:p-6">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink/50">
                  <g.Icon className="h-4 w-4" />
                  {g.label}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {g.items.map((it) => (
                    <li key={it} className="text-[15px] leading-relaxed text-ink/75">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Block 3: the differentiator. Nobody writes this section
              because it costs them the recognition that drives shares. */}
          <h2 className="font-serif mt-14 text-3xl leading-tight">When it is not that</h2>
          <p className="mt-5 text-base leading-relaxed text-ink/75">
            Most lists of warning signs are written so that everyone finds themselves in them. Here is the other
            side, which is the part you actually came for.
          </p>
          <div className="mt-6 space-y-4 rounded-3xl bg-card p-6 sm:p-7">
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">Shouting in an argument is not automatically abuse.</span> Two people
              who both raise their voices, both calm down, and both come back to the subject are having a bad
              fight, not a power struggle. What matters is whether the original thing ever gets returned to.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">Needing reassurance is not manipulation.</span> Asking whether things
              are okay because you are anxious is different from making someone prove it on a schedule. The line
              is whether they are allowed to say no.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">Being difficult during a bad month is not a personality.</span> People
              are worse company when they are grieving, ill, or exhausted. A pattern is something that survives the
              circumstances that explained it.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">Feeling guilty is not evidence.</span> Guilt tracks how much you care
              about being good, not how much harm you did. That is precisely why the wrong people never feel it.
            </p>
          </div>

          {/* Block 4: observable and countable. The house style - behaviour
              over adjectives - applied to a question people usually answer
              with feelings. */}
          <h2 className="font-serif mt-14 text-3xl leading-tight">What to look at instead</h2>
          <p className="mt-5 text-base leading-relaxed text-ink/75">
            Stop asking how you feel about yourself and count four things. All of them are visible in the last
            month of your messages.
          </p>
          <ol className="mt-6 space-y-4">
            {[
              ["After a fight, who comes back first - and does the original subject ever get finished?", "One person always repairing is a lopsided relationship. Nobody ever finishing the subject is something else."],
              ["When they tell you something you did hurt them, what happens in the next ten minutes?", "If it becomes about your intentions rather than their hurt, that move is yours to own. If it becomes about your sensitivity when you are the one hurt, it is not."],
              ["Is there anything you do that you hide?", "Checking a phone, reading messages, tracking a location. Hiding it means you already made the judgement."],
              ["Do they get to say no - to plans, to sex, to a conversation - without it costing them?", "This one is the closest thing to a single question that works."],
            ].map(([q, why]) => (
              <li key={q} className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
                <p className="text-[15px] font-medium leading-relaxed text-ink">{q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{why}</p>
              </li>
            ))}
          </ol>

          {/* The answer that costs us something to write, and is the whole
              reason to trust the page. */}
          <div className="mt-10 rounded-3xl border-2 border-pink/25 bg-pink-soft/30 p-6 sm:p-7">
            <p className="font-serif text-xl leading-snug">And if the answer is yes?</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
              Then you are in the smallest and most hopeful group on this page. Someone who can look at their own
              behaviour and name it accurately is the only kind of person who changes. The move is not to
              apologise harder - it is to stop the specific thing, this week, without requiring them to notice.
            </p>
          </div>
        </div>
      </article>

      {/* Block 5: the chat, seeded. The reason an article here beats an
          article anywhere else - it can end in a read of her own messages
          instead of another general description. */}
      <section className="bg-card px-5 py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">A page cannot answer this. Yours can.</h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70">
            Everything above is general. Whether it describes you is in the specifics - who repairs, who returns to
            the subject, what happens in the ten minutes after. Tell it what happened, or paste the thread.
          </p>

          <div className="mt-9 w-full max-w-lg text-left sm:max-w-2xl lg:max-w-3xl">
            <IntakeChat
              seed={seed}
              onStarted={() => trackEvent("chip_clicked", { surface: "patterns_toxic_one", chip_text: seed })}
            />
          </div>

          <div className="mt-4 flex w-full max-w-lg flex-wrap justify-center gap-2">
            {OPENERS.map((o) => (
              <button
                key={o}
                onClick={() => setSeed(o)}
                disabled={Boolean(seed)}
                className="rounded-full border border-pink/30 bg-pink-soft/40 px-3.5 py-2 text-[13px] text-ink/80 transition hover:bg-pink-soft disabled:opacity-40"
              >
                {o}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink/50">First read is free. Screenshots optional.</p>
        </div>
      </section>

      {/* Block 6: routing. This query catches people who have been told
          they are the problem by someone making them the problem, so the
          exit has to be here and it has to be short. */}
      <section className="px-5 py-14">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border/60 bg-card p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/50">If you are frightened</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
            If you are asking this question because someone tells you constantly that you are the problem, and you
            are afraid of what happens when you disagree, that is a different situation than the one this page
            describes, and it is not one to work out alone. In the US,{" "}
            <a
              href="https://www.loveisrespect.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
            >
              loveisrespect
            </a>{" "}
            is free and confidential, 24/7. In the UK, the National Domestic Abuse Helpline is 0808 2000 247.
          </p>
        </div>
      </section>

      {/* Block 7: sources. Cheap to add, and the thing that separates this
          from the AI-written pages Google has spent two years demoting. */}
      <section className="px-5 pb-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">Where this comes from</p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink/60">
            <li>
              The repair question and the four-behaviours framing come from John Gottman&apos;s longitudinal work on
              couples - criticism, contempt, defensiveness and stonewalling.
            </li>
            <li>
              The power-and-control framing, and the line between a bad fight and a pattern, follow the Duluth
              model used by domestic abuse services.
            </li>
            <li>
              <a
                href="https://www.loveisrespect.org/everyone-deserves-a-healthy-relationship/relationship-spectrum/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-ink/25 underline-offset-2 hover:decoration-ink"
              >
                loveisrespect&apos;s relationship spectrum
              </a>{" "}
              - healthy, unhealthy and abusive as a scale rather than a verdict.
            </li>
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-ink/55">
            This is a description of patterns, not a diagnosis of anyone, and it is not therapy.
          </p>

          <Link
            to="/patterns"
            className="mt-8 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
          >
            More patterns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
