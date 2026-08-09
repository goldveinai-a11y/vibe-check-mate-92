import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Ear, Eye, HeartCrack } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { IntakeChat } from "@/components/IntakeChat";
import { trackEvent } from "@/lib/analytics";

// The angle here is topic drift, not tone. Everyone else writes about how
// blame-shifting sounds. The useful test is whether the subject of the
// conversation changed, which is countable and does not depend on reading
// anyone's intent. A calm conversation can be fully reversed; a loud one can
// stay on topic the whole way through.

export const Route = createFileRoute("/patterns/blame-shifting")({
  component: BlameShiftingPage,
  head: () => ({
    meta: [
      { title: "Blame-shifting: why every argument ends with you apologising | VibeCheck" },
      {
        name: "description",
        content:
          "You raise one thing he did and leave apologising for four things you did. The tell is not his tone — it is whether the subject of the conversation changed.",
      },
      { property: "og:title", content: "Blame-shifting: why every argument ends with you apologising" },
      {
        property: "og:description",
        content:
          "Track the topic, not the volume. What blame-shifting is, when it is something else, and four things you can count without confronting anyone.",
      },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://vibecheckapp.app/patterns/blame-shifting" }],
  }),
});

const OPENERS = [
  "Every argument ends with me apologising",
  "He turns it around on me every time",
  "I bring up one thing and leave with five",
  "He gets upset and I end up comforting him",
];

const SIGNALS = [
  {
    icon: Ear,
    label: "Sounds like",
    items: [
      "\u201CI only did that because you\u2026\u201D",
      "\u201CYou\u2019re being really aggressive right now.\u201D",
      "\u201CWhy do you always have to make me the bad guy?\u201D",
    ],
  },
  {
    icon: Eye,
    label: "Looks like",
    items: [
      "The conversation ends with you explaining your tone.",
      "A list of your past mistakes appears, in order, with dates.",
      "He becomes upset about the thing he did, and you comfort him about it.",
    ],
  },
  {
    icon: HeartCrack,
    label: "Feels like",
    items: [
      "Walking in with one clear thing and walking out holding four vague ones.",
      "Not being able to remember what you originally wanted to say.",
      "Deciding it is not worth raising the next one.",
    ],
  },
];

function BlameShiftingPage() {
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
            Blame-shifting
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-ink/80">
            You raise something he did. Twenty minutes later you are apologising. Blame-shifting
            is not a fight you lost &mdash; it is a fight about a different subject than the one
            you started, and the subject changed while you were still trying to be fair.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            The tell is not his tone. Track the topic, not the volume. A quiet, kind, entirely
            reasonable-sounding conversation can be completely reversed, and a loud one can stay
            on the original point the whole way through. Only one of those two things is countable
            afterwards, which is lucky, because the tone is the part you will doubt later.
          </p>

          <h2 className="font-serif mt-14 text-3xl leading-tight">What the turn looks like</h2>

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
            The cost is not the argument. It is the shortening list of things you are willing to
            bring up, and you are the only person who can see that list.
          </p>

          <h2 className="font-serif mt-14 text-3xl leading-tight">When it is not that</h2>

          <div className="mt-6 space-y-4 rounded-3xl bg-card p-6 sm:p-7">
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">He is right and you did do the thing.</span> Being
              wrong is not the same as being reversed. The test: delete your complaint entirely
              &mdash; does his point still stand on its own? If it does, he raised something, he
              did not deflect something.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">You both did something.</span> Two real topics is not
              topic replacement. What separates them is whether yours ever gets addressed &mdash;
              on the night, the next morning, a week later. Postponed forever is the same as
              answered never.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">You opened with his character, not his behaviour.</span>{" "}
              &ldquo;You never think about anyone but yourself&rdquo; is not a topic, it is a
              verdict, and defending against it is not deflection. Gottman found the first three
              minutes of a conversation predict how it ends; a harsh start usually gets you a
              defensive one.
            </p>
            <p className="text-[15px] leading-relaxed text-ink/80">
              <span className="font-medium">He shuts down instead.</span> Withdrawing is not
              reversing. He is not making it about you, he is leaving the room. That has its own
              cost and its own name, but it is a different mechanism and it needs a different fix.
            </p>
          </div>

          <h2 className="font-serif mt-14 text-3xl leading-tight">Four things you can count</h2>

          <p className="mt-6 text-base leading-relaxed text-ink/75">
            All four are counted after the fact, on your own, with no conversation required.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                Who apologises at the end?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Last five disagreements. Not who was sorrier &mdash; who said the words. Five out
                of five in one direction is a structure, not a run of bad luck.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                How many topics in, how many topics out?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Write the one thing down before you raise it. Afterwards, write what you ended up
                discussing. The gap between those two notes is the whole pattern in one line.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                Does your original point ever come back?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Not in that conversation &mdash; ever. Someone who lost their footing in the
                moment often returns to it once it is calm. Someone for whom the reversal works
                never has to.
              </p>
            </div>

            <div className="rounded-2xl border-l-2 border-pink/40 bg-card py-4 pl-5 pr-4">
              <p className="text-[15px] font-medium leading-relaxed text-ink">
                Are you rehearsing now?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                Drafting a complaint in advance to make it unarguable is a real cost, and it is
                one you pay privately. Count how many you drafted and never delivered.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border-2 border-pink/25 bg-pink-soft/30 p-6 sm:p-7">
            <h3 className="font-serif text-xl leading-snug">The version that is not tactical</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
              Sometimes the reversal is not strategy. Some people cannot sit inside being at fault
              for more than a few seconds, and the flip outward is the fastest way out. That does
              not make the cost to you any smaller, but it changes what would fix it &mdash; and
              the third question above is what tells the two apart. Coming back to it later is
              the difference.
            </p>
          </div>
        </article>
      </section>

      <section className="bg-card px-5 py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Show it the actual argument
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70">
            Paste screenshots of the thread, or describe it in your own words. It follows where
            the subject went, and it will tell you if you started it badly, too.
          </p>

          <div className="mt-9 w-full max-w-lg text-left sm:max-w-2xl lg:max-w-3xl">
            <IntakeChat
              seed={seed}
              onStarted={() =>
                trackEvent("chip_clicked", { surface: "patterns_blame_shifting", chip_text: seed })
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
            One thing worth separating out
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
            If the reversals arrive alongside your phone being checked, your money being managed,
            or who you see being decided, those are not four separate habits &mdash; and there are
            people whose only job is that situation, free and at any hour. In the US,{" "}
            <a
              href="https://www.loveisrespect.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
            >
              loveisrespect
            </a>{" "}
            &mdash; 1.866.331.9474, or text LOVEIS to 22522. In the UK, the National Domestic Abuse
            Helpline on 0808 2000 247.
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
              John Gottman on harsh startup and on defensiveness as counterattack rather than
              explanation &mdash; and on stonewalling as a separate mechanism from it.
            </li>
            <li>
              Jennifer Freyd&rsquo;s description of deny, attack, and reverse victim and offender,
              which is the pattern in its most complete form.
            </li>
            <li>
              Marshall Rosenberg on observation versus evaluation &mdash; the reason a complaint
              about behaviour survives a conversation and a verdict about character does not.
            </li>
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-ink/55">
            This is a reading of behaviour, not a diagnosis of a person.
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
