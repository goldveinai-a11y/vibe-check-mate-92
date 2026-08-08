import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  Users,
  LineChart,
  MessageCircleHeart,
  Sparkles,
  Heart,
  Compass,
  Anchor,
  AlertTriangle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { trackEvent } from "@/lib/analytics";

// The long-form version of the credibility material that used to occupy
// most of the landing page. It was moved here because it was doing real
// harm up front - a visitor arriving from a TikTok ad in a 1am state of
// mind does not read eight cards about Bowlby before deciding whether to
// try something - but it's genuinely useful to the smaller group who go
// looking for it before paying. That's a page you visit on purpose, which
// is why it's linked from the footer rather than the main nav.

export const Route = createFileRoute("/science")({
  head: () => ({
    meta: [
      { title: "The research behind VibeCheck" },
      {
        name: "description",
        content:
          "The psychology behind VibeCheck: attachment theory, Gottman's research, nonviolent communication and the Big Five - plus what AI can't read.",
      },
      { property: "og:title", content: "The research behind VibeCheck" },
      {
        property: "og:description",
        content:
          "Attachment theory, Gottman, nonviolent communication and the Big Five - the models behind every VibeCheck read.",
      },
      { property: "og:url", content: "https://vibecheckapp.app/science" },
    ],
    links: [{ rel: "canonical", href: "https://vibecheckapp.app/science" }],
  }),
  component: SciencePage,
});

const FRAMEWORKS = [
  {
    Icon: Users,
    title: "Attachment styles",
    credit: "Bowlby & Ainsworth",
    body:
      "Whether someone leans anxious, avoidant, secure or disorganised shows up remarkably clearly in text: how they respond to closeness, what happens right after a vulnerable message, whether distance appears on a schedule. We read those patterns rather than guessing at personality.",
  },
  {
    Icon: LineChart,
    title: "Relationship health",
    credit: "Gottman",
    body:
      "John Gottman's decades of couples research identified four behaviours that predict trouble better than almost anything else - criticism, contempt, defensiveness and stonewalling. They're visible in a chat thread, and their absence matters as much as their presence.",
  },
  {
    Icon: MessageCircleHeart,
    title: "Conflict and empathy",
    credit: "Rosenberg",
    body:
      "Nonviolent Communication draws a sharp line between an observation and an evaluation. That line is where most text arguments go wrong, and it's a reliable place to find tension that neither person has named out loud yet.",
  },
  {
    Icon: Sparkles,
    title: "Hidden emotional signals",
    credit: "Ekman",
    body:
      "Paul Ekman's work is about faces, not phones - but the underlying idea carries: brief, involuntary signals leak feelings people aren't stating. In text those become timing shifts, sudden formality, message length collapsing, punctuation changing.",
  },
  {
    Icon: Brain,
    title: "Personality profile",
    credit: "Big Five",
    body:
      "The Big Five is the most empirically supported personality model in psychology. Reading roughly where someone sits on it - especially agreeableness and neuroticism - explains a lot of behaviour that otherwise reads as personal rejection.",
  },
  {
    Icon: Heart,
    title: "Love language signals",
    credit: "Chapman",
    body:
      "Less rigorous than the rest, and we treat it that way - it's a useful vocabulary rather than hard science. Still, noticing that someone consistently expresses care one way and not another explains a lot of mismatched effort.",
  },
];

function SciencePage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-4 pb-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep">
              <Brain className="h-3.5 w-3.5" />
              Not vibes-based
            </span>
            <h1 className="font-serif mt-5 text-4xl leading-[1.05] sm:text-5xl">
              What the read is actually built on
            </h1>
            <p className="mt-4 text-base text-ink/70">
              VibeCheck reads 100+ signals in how two people talk. Here's the thinking behind them - and, at the
              bottom, an honest account of what this can't do.
            </p>
          </div>

          {/* Why ambiguity hurts */}
          <h2 className="font-serif mt-12 text-2xl sm:text-3xl">Why not knowing is the worst part</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-soft">
                <Compass className="h-5 w-5 text-purple-deep" />
              </div>
              <h3 className="font-serif mt-4 text-xl">Uncertainty Reduction Theory</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">
                Berger and Calabrese found that not knowing where you stand with someone is itself a source of
                stress - our brains push hard for predictability in relationships. Re-reading the same messages
                doesn't resolve that, because you already know what they say. What resolves it is a structured
                outside read of the patterns underneath them.
              </p>
            </div>
            <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-soft">
                <Anchor className="h-5 w-5 text-pink" />
              </div>
              <h3 className="font-serif mt-4 text-xl">The Zeigarnik Effect</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">
                Bluma Zeigarnik showed that unfinished situations occupy memory far more than resolved ones. It's
                why an unanswered "where is this going" keeps surfacing at 1am while settled questions don't. A
                clear read gives that loop somewhere to land - even when the answer isn't the one you wanted.
              </p>
            </div>
          </div>

          {/* Frameworks */}
          <h2 className="font-serif mt-12 text-2xl sm:text-3xl">The frameworks we read against</h2>
          <div className="mt-5 space-y-3">
            {FRAMEWORKS.map((f) => (
              <div key={f.title} className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <f.Icon className="h-5 w-5 shrink-0 text-purple-deep" />
                  <h3 className="font-serif text-xl">{f.title}</h3>
                  <span className="ml-auto shrink-0 text-xs text-ink/45">{f.credit}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">{f.body}</p>
              </div>
            ))}
          </div>

          {/* The honest bit */}
          <div className="mt-12 rounded-3xl border border-border/60 bg-ink p-6 text-white shadow-lg sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <AlertTriangle className="h-4 w-4" />
              What this can't do
            </div>
            <h2 className="font-serif mt-3 text-2xl leading-tight">The honest limits</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
              <li>
                <span className="font-medium text-white">It only sees what you show it.</span> A few screenshots
                are a slice of a relationship, not the whole thing. Someone can be warm in person and terrible over
                text, or the reverse.
              </li>
              <li>
                <span className="font-medium text-white">It reads patterns, not minds.</span> An avoidant read
                means the behaviour matches a known pattern. It doesn't mean we know what he's thinking, and it
                isn't a diagnosis of anybody.
              </li>
              <li>
                <span className="font-medium text-white">It isn't therapy.</span> This is a structured second
                opinion. If something in a relationship is frightening you, that needs a real person - a friend, a
                professional, or both.
              </li>
              <li>
                <span className="font-medium text-white">You get the final say.</span> You know things about this
                person that no screenshot contains. If the read contradicts something you're certain of, trust
                yourself and treat this as one input.
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <h3 className="font-serif text-2xl sm:text-3xl">Ready to see yours?</h3>
            <p className="mt-2 text-sm text-ink/70">
              A short AI chat. Screenshots optional. Your first read is free.
            </p>
            <Link
              to="/quiz"
              onClick={() => trackEvent("cta_clicked", { position: "science" })}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
            >
              <Heart className="h-4 w-4 fill-white" />
              Start my VibeCheck
            </Link>
            <p className="mt-4 text-sm text-ink/60">
              Or{" "}
              <Link to="/example" className="font-medium text-purple-deep underline underline-offset-4">
                see a full example report
              </Link>{" "}
              first.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
