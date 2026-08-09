import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// The editorial hub.
//
// Separate from /rocd on purpose. That page is a landing page for paid
// traffic with one job: convert an intent that arrives already knowing what
// it wants. These are articles, and their job is to answer a question well
// enough that Google shows them and a stranger trusts them.
//
// The thing that makes these worth writing at all is the last block on every
// page: the chat, seeded with the topic. An article site cannot end in a
// personal read. That is the whole edge, and it is why five good pages here
// are worth more than thirty thin ones.

export const Route = createFileRoute("/patterns/")({
  head: () => ({
    meta: [
      { title: "Patterns - what the behaviour actually means | VibeCheck" },
      {
        name: "description",
        content:
          "Plain reads on the patterns people actually search for - walking on eggshells, blame-shifting, avoidant partners - including when it is NOT that.",
      },
      { property: "og:title", content: "Patterns - what the behaviour actually means" },
      { property: "og:url", content: "https://vibecheckapp.app/patterns" },
    ],
    links: [{ rel: "canonical", href: "https://vibecheckapp.app/patterns" }],
  }),
  component: PatternsHub,
});

type Entry = { to: string; title: string; blurb: string; live: boolean };

const ENTRIES: Entry[] = [
  {
    to: "/patterns/am-i-the-toxic-one",
    title: "Am I the toxic one?",
    blurb:
      "The question almost nobody answers straight, because answering it honestly means sometimes saying yes.",
    live: true,
  },
  {
    to: "/rocd",
    title: "When the doubt keeps coming back",
    blurb:
      "You have asked him, your friends and the internet. Every answer lasted an hour. Why that happens.",
    live: true,
  },
  {
    to: "/patterns/walking-on-eggshells",
    title: "Walking on eggshells",
    blurb:
      "What the phrase actually describes, and the single question that separates a difficult temper from something worse.",
    live: false,
  },
  {
    to: "/patterns/blame-shifting",
    title: "When it always ends up being your fault",
    blurb:
      "He did something, you said it hurt, and somehow the conversation is now about your reaction.",
    live: false,
  },
  {
    to: "/patterns/avoidant-partner",
    title: "He pulls away every time you get close",
    blurb:
      "Warm week, then distance, then back like nothing happened. What the timing tells you.",
    live: false,
  },
];

function PatternsHub() {
  const live = ENTRIES.filter((e) => e.live);
  const soon = ENTRIES.filter((e) => !e.live);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      <section className="px-5 pt-8 pb-14 sm:pt-12 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-[40px] leading-[1.05] sm:text-6xl">Patterns</h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">
            Behaviour that has a name, described plainly - what it sounds like, what it looks like, and the part
            most articles leave out: when it is NOT that.
          </p>

          {/* Said out loud, because it is the reason to trust the rest.
              Every list of warning signs on the internet is written so that
              everybody recognises themselves in it. */}
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/60">
            Most lists of red flags are written so that everyone finds themselves in them. These are not. Each one
            says where the line is, and what falls on the ordinary side of it.
          </p>

          <div className="mt-10 space-y-4">
            {live.map((e) => (
              <Link
                key={e.to}
                to={e.to}
                className="group block rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition hover:border-pink/40 sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl">{e.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70 sm:text-base">{e.blurb}</p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-ink/30 transition group-hover:text-pink" />
                </div>
              </Link>
            ))}
          </div>

          {soon.length > 0 && (
            <div className="mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">Being written</p>
              <div className="mt-4 space-y-3">
                {soon.map((e) => (
                  <div key={e.to} className="rounded-2xl border border-border/50 bg-card/50 px-5 py-4">
                    <p className="font-serif text-lg text-ink/60">{e.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/45">{e.blurb}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 rounded-3xl bg-ink p-6 text-white sm:p-8">
            <p className="font-serif text-xl leading-snug sm:text-2xl">
              None of this can tell you about your relationship.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
              A page describes a pattern in general. Whether it is yours depends on things only your own messages
              contain. That is what the read is for - and the first one is free.
            </p>
            <Link
              to="/"
              hash="chat"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-ink transition hover:opacity-90"
            >
              Check mine
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
