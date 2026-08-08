import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw, Search, Clock, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { IntakeChat } from "@/components/IntakeChat";
import { trackEvent } from "@/lib/analytics";

// Landing for the relationship-OCD intent.
//
// A separate page rather than a section on "/" because the two audiences
// want opposite things. The home page asks "Is it toxic - or are you
// overthinking it?" and answers it. Someone searching "rocd test" or "how
// to stop questioning my relationship" has usually been answered many
// times already; another verdict is the last thing that helps, and a
// headline promising one reads as more of the same.
//
// The angle is the inversion: this is the page that refuses to reassure,
// and says up front why. No competitor in the category can copy that line
// without dismantling their own product - all of them are built to deliver
// the verdict.
//
// The chat is the SAME component and the SAME behaviour as everywhere
// else. No stance switch, no new mechanics. This page is a demand test:
// find out whether this traffic engages and converts before building
// anything special for it.
//
// Wording note: everything here talks about doubt and the loop, never
// about treating a condition. Partly because that is honest - we describe
// a pattern, we do not diagnose or treat - and partly because health
// claims are what get mental-health ads rejected on Google and Meta.

export const Route = createFileRoute("/rocd")({
  head: () => ({
    meta: [
      { title: "Relationship doubt: why the answer never sticks" },
      {
        name: "description",
        content:
          "If you keep checking whether you really love him and re-reading the messages, you don't need another answer. An AI that names the loop instead of feeding it.",
      },
      { property: "og:title", content: "Relationship doubt: why the answer never sticks" },
      {
        property: "og:description",
        content:
          "Checking, re-reading, asking again. VibeCheck names the doubt loop instead of feeding it.",
      },
      { property: "og:url", content: "https://vibecheckapp.app/rocd" },
    ],
    links: [{ rel: "canonical", href: "https://vibecheckapp.app/rocd" }],
  }),
  component: RocdPage,
});

// Openers written as things she would actually say, in the language this
// search intent uses. Tapping one sends it as her first message, exactly
// like the home page.
const OPENERS = [
  "I can't stop questioning whether I love him",
  "Nothing's wrong but I keep checking how I feel",
  "I re-read our messages looking for a sign",
  "Am I settling, or is this just doubt?",
];

function RocdPage() {
  const [seed, setSeed] = useState<string | undefined>();

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      <section className="px-5 pt-6 pb-14 sm:pt-10 sm:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep sm:text-sm">
            <RefreshCw className="h-3.5 w-3.5" />
            For the doubt that keeps coming back
          </span>

          {/* The headline is about the ANSWERS, not about him. Someone at
              this search intent has been reassured many times; naming that
              the reassurance stopped working is what makes her feel
              recognised rather than handled. */}
          <h1 className="font-serif mt-8 text-[42px] leading-[1.05] sm:text-6xl md:text-7xl">
            The answer never sticks, does it?
          </h1>

          <p className="mt-5 max-w-xl text-base text-ink/70 sm:text-lg">
            You've asked him. You've asked your friends. You've probably asked the internet at 2am. Every answer
            worked for about an hour - and then the question came back wearing different words.
          </p>

          {/* The whole positioning in one line, and the one thing every
              competitor is structurally unable to say. */}
          <p className="mt-6 max-w-xl font-serif text-xl leading-snug text-ink sm:text-2xl">
            This is an AI that won't reassure you - because the reassurance is what keeps it going.
          </p>

          <div className="mt-9 w-full max-w-lg text-left">
            <IntakeChat
              seed={seed}
              onStarted={() => trackEvent("intake_started", { surface: "rocd", seeded: Boolean(seed) })}
            />
          </div>

          <div className="mt-4 flex w-full max-w-lg flex-wrap justify-center gap-2">
            {OPENERS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  trackEvent("rocd_opener_tapped", { opener: opt });
                  setSeed(opt);
                }}
                disabled={Boolean(seed)}
                className="rounded-full border border-purple/30 bg-purple-soft/40 px-3.5 py-2 text-[13px] text-ink/80 transition hover:bg-purple-soft disabled:opacity-40"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Why the answers stop working - the section that has to earn
          belief. Explains the mechanism in plain language, without naming
          a diagnosis or claiming to treat one. */}
      <section className="bg-card px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Why nothing you've been told has held</h2>
          <p className="mt-5 text-base leading-relaxed text-ink/75">
            Reassurance works the way scratching works. It gives real relief, quickly - and it teaches the itch to
            come back sooner and louder. Every time the doubt gets answered, the answering becomes a slightly more
            necessary part of the loop.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/75">
            Which is why the number of times you've been told "he clearly loves you" has no relationship at all to
            how certain you feel right now.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                Icon: Search,
                title: "The checking",
                body: "Re-reading the thread. Testing how you feel when he walks in. Comparing your relationship to other people's.",
              },
              {
                Icon: Clock,
                title: "The relief",
                body: "An answer lands. The anxiety drops for twenty minutes, maybe an afternoon. It always ends.",
              },
              {
                Icon: RefreshCw,
                title: "The return",
                body: "The question comes back rephrased, so it feels like a new question that hasn't been answered yet.",
              },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-border/60 bg-cream p-5">
                <c.Icon className="h-5 w-5 text-purple-deep" />
                <h3 className="font-serif mt-3 text-lg">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Answers the obvious objection to "won't reassure you" - then what
          is it for? The same receipts mechanic, pointed at the loop
          instead of at him. */}
      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">So what does it do instead?</h2>
          <p className="mt-5 text-base leading-relaxed text-ink/75">
            It reads the messages - all of them, same as always. It just answers a different question than the one
            you'd ask. Not what he meant. What you did.
          </p>

          <div className="mt-6 rounded-3xl bg-ink p-6 text-white shadow-lg sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">What that reads like</p>
            <p className="mt-4 text-base leading-relaxed text-white/90">
              "In this thread you asked him to confirm things were fine four times. He confirmed it four times. The
              average gap before you asked again was forty minutes.
            </p>
            <p className="mt-3 text-base leading-relaxed text-white/90">
              The answer you're asking me for right now is the fifth one. It'll last about as long."
            </p>
          </div>

          <p className="mt-6 text-base leading-relaxed text-ink/75">
            That's not an opinion about your relationship. It's a count, taken from your own messages - the one
            source you can't argue with at 2am.
          </p>
        </div>
      </section>

      {/* The honest limit. Saying "the thing that helps is not this
          product" costs a little conversion and buys the only thing that
          makes the rest of the page credible. */}
      <section className="bg-purple-soft px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
            <ShieldCheck className="h-4 w-4" />
            Where this stops
          </div>
          <h2 className="font-serif mt-3 text-3xl leading-tight sm:text-4xl">One thing this is not</h2>
          <p className="mt-5 text-base leading-relaxed text-ink/80">
            This reads a conversation. It isn't therapy, it isn't a diagnosis, and it can't tell you whether you're
            in the right relationship - nothing can do that from the outside, and anything claiming to is selling
            you the same hour of relief you've already bought.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/80">
            If this pattern is running your week, the thing that actually works on it is a specific kind of therapy -
            ERP - and it works by teaching you to sit with the not-knowing rather than resolve it. The International
            OCD Foundation keeps a directory at{" "}
            <a
              href="https://iocdf.org/find-help/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-purple-deep/40 underline-offset-2 hover:decoration-purple-deep"
            >
              iocdf.org
            </a>
            . That's a better use of your next hour than another read.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="font-serif text-3xl sm:text-4xl">Still want to be told it's fine?</h2>
          <p className="mt-4 max-w-lg text-base text-ink/70">
            That's the loop asking. Start at the top and tell it what's going on instead - it'll show you the
            pattern rather than hand you the twelfth answer.
          </p>
          <button
            onClick={() => {
              trackEvent("cta_clicked", { position: "rocd_footer" });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Show me the pattern
          </button>
          <p className="mt-3 text-xs text-ink/50">First read is free. Screenshots optional.</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
