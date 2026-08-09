import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Ear, Eye, HeartCrack } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { IntakeChat } from "@/components/IntakeChat";
import { trackEvent } from "@/lib/analytics";

// Editorial page. The angle that makes this page worth existing is in the
// third block: the diagnostic is not how bad his reactions are, it is
// whether the rules are stable or shifting. Every competing article on this
// keyword is a list of signs. None of them make that distinction, and it is
// the distinction that separates a difficult temperament from coercive
// control.
//
// Tone rule: this is a T1 page. No hotline in the body, no alarm, no telling
// anyone to leave. The safety route sits at the bottom, offered once,
// conditional, and quiet.

export const Route = createFileRoute("/patterns/walking-on-eggshells")({
  component: EggshellsPage,
  head: () => ({
    meta: [
      { title: "Walking on eggshells around him — what it actually means | VibeCheck" },
      {
        name: "description",
        content:
          "Walking on eggshells is not a communication problem. The question that matters is whether his rules stay the same or keep moving — and how to tell which one you are in.",
      },
      { property: "og:title", content: "Walking on eggshells around him — what it actually means" },
      {
        property: "og:description",
        content:
          "Not a list of signs. The one distinction that separates a difficult temperament from something more serious, and four things you can count this week.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://vibecheckapp.app/patterns/walking-on-eggshells" }],
  }),
});

const OPENERS = [
  "I walk on eggshells around him",
  "I never know which version of him I'm getting",
  "It's easier to just agree with him",
  "I apologise even when I don't know what I did",
];

const SIGNALS = [
  {
    icon: Ear,
    label: "Sounds like",
    items: [
      "\u201CI'm fine with whatever you want.\u201D",
      "\u201CI was going to say something, but it wasn't important.\u201D",
      "An apology that arrives before the sentence it belongs to.",
    ],
  },
  {
    icon: Eye,
    label: "Looks like",
    items: [
      "Drafting a two-line message four times before you send it.",
      "Reading his face before you answer a question.",
      "Timing what you ask for around what kind of day he had.",
    ],
  },
  {
    icon: HeartCrack,
    label: "Feels like",
    items: [
      "Relief when he leaves the room \u2014 and guilt about the relief.",
      "Being tired in a way sleep does not fix.",
      "Not knowing what you think until you know what he thinks.",
    ],
  },
];

function EggshellsPage() {
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
            Walking on eggshells around him
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-ink/80">
            It means you run a model of his mood before you open your mouth. You are not choosing
            your words for kindness. You are choosing them for safety. That is not a communication
            problem, and advice about communicating better will not touch it.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            The question that decides what you are actually in is not how bad his reactions get.
            It is whether the rules hold still. Stable rules mean a difficult temperament you have
            learned to navigate. Rules that keep moving mean the moving is the mechanism.
          </p>

          <h2 className="font-serif mt-14 text-3xl leading-tight">What it looks like from inside</h2>

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
            The exhausting part is not the arguments. It is the work you do so there are none.
            That work is invisible, it is unpaid, and you are the only one doing it.
          </p>

          <h2 className="font-serif mt-14 text-3xl leading-tight">When it is not that</h2>

          <div className="mt-6 space-y-4 rounded-3xl bg-card p-6 sm:p-7">
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">He is having a hard month, not a hard decade.</span>{" "}
              Eggshells is a standing arrangement, not a bad stretch. If you can date when this
              started and it was recently, you are describing pressure, not a pattern.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">You do this with everyone.</span> If you also manage
              your mother's mood, your manager's mood and the mood of a stranger at a till, the
              habit travels with you and it is yours. Still worth solving. Different problem.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">You have known him six weeks.</span> Care at the start
              is not eggshells. Eggshells is care that stopped decreasing. If you are more careful
              in month nine than you were in month two, that is the finding.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">He is ill, grieving, or in treatment.</span> Then
              handling him gently is a decision you made, and there is one way to tell the
              difference: could you stop &mdash; and would anything happen to you if you did?
            </p>
          </div>

          <p className="mt-5 text-base leading-relaxed text-ink/75">
            That last test is the one that does the work. A decision you can reverse is a
            decision. A decision you cannot reverse is a rule.
          </p>

          <h2 className="font-serif mt-14 text-3xl leading-tight">Four things you can count</h2>

          <p className="mt-6 text-base leading-relaxed text-ink/75">
            Not feelings. Counts. None of these require his cooperation, and none of them require
            you to raise anything with him.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                When you get it wrong, what does he actually do?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Behaviour, not mood. Write down the last three. Silence for two days is a
                different fact from a raised voice, and both are different from nothing at all.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                Is it the same thing every time, or does it move?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                This is the one that matters most. Fixed triggers can be learned and worked
                around. Triggers that shift cannot be &mdash; and a rule you can never get right
                keeps you permanently attentive, which is what it is for.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                After a bad exchange, who speaks first?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Count the last five. If it is you five times out of five, repair is not shared
                work in this relationship. It is your job, and he has no reason to learn it.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                What have you stopped mentioning?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Make the actual list. A friend, a job offer, a plan, an opinion about his family.
                The length of that list is the size of the arrangement, and most people are
                surprised by it.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border-2 border-pink/25 bg-pink-soft/30 p-6 sm:p-7">
            <h3 className="font-serif text-xl leading-snug">And if the rules do move?</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
              Then you are not managing a temper. You are being kept attentive, and whether that
              is on purpose or by accident, from where you stand the effect is the same. Naming
              that is a different act from deciding what to do about it. You do not have to decide
              anything today.
            </p>
          </div>
        </article>
      </section>

      <section className="bg-card px-5 py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Or just show it the thread
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70">
            Describe it in your own words, or paste screenshots of the messages. It reads what is
            actually there and tells you what it sees &mdash; including the parts you may not want
            to hear.
          </p>

          <div className="mt-9 w-full max-w-lg text-left sm:max-w-2xl lg:max-w-3xl">
            <IntakeChat
              seed={seed}
              onStarted={() =>
                trackEvent("chip_clicked", { surface: "patterns_eggshells", chip_text: seed })
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
            If the rules cover more than your words
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
            If what you have to manage now includes your phone, your money, or who you are allowed
            to see, that is a different conversation, and there are people who do only this &mdash;
            free, and at any hour. In the US,{" "}
            <a
              href="https://www.loveisrespect.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
            >
              loveisrespect
            </a>{" "}
            &mdash; 1.866.331.9474, or text LOVEIS to 22522. In the UK, the National Domestic Abuse
            Helpline on 0808 2000 247. You do not have to be sure before you call.
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
              John Gottman's work on repair attempts and who does the repairing &mdash; the
              asymmetry, not the arguing, is what predicts outcomes.
            </li>
            <li>
              The Duluth power and control model, which is where the distinction between fixed and
              shifting rules comes from.
            </li>
            <li>
              The{" "}
              <a
                href="https://www.loveisrespect.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-ink/25 underline-offset-2 hover:decoration-ink"
              >
                loveisrespect
              </a>{" "}
              relationship spectrum, which treats this as a range rather than two boxes.
            </li>
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-ink/55">
            This is a reading of behaviour, not a diagnosis of a person, and it is written for the
            person doing the managing.
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
