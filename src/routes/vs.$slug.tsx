import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, Check, X, Scale } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCompetitor } from "@/lib/competitors";
import { trackEvent } from "@/lib/analytics";

// One route, one page per competitor, all driven from lib/competitors.ts.
// These target "<competitor> alternative" searches - the highest-intent
// query in the category, because someone typing it has already decided
// the other product isn't working for them.

export const Route = createFileRoute("/vs/$slug")({
  loader: ({ params }) => {
    const competitor = getCompetitor(params.slug);
    if (!competitor) throw notFound();
    return competitor;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `VibeCheck vs ${loaderData.name} - which one do you actually need?` },
          {
            name: "description",
            content: `${loaderData.difference} An honest side-by-side, including when ${loaderData.name} is the better choice.`,
          },
        ]
      : [],
  }),
  component: VersusPage,
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
      <div>
        <h1 className="font-serif text-3xl">Nothing to compare here</h1>
        <Link to="/" className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-white">
          Back home
        </Link>
      </div>
    </main>
  ),
});

function VersusPage() {
  const c = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-4 pb-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep">
              <Scale className="h-3.5 w-3.5" />
              Honest comparison
            </span>
            <h1 className="font-serif mt-5 text-4xl leading-[1.05] sm:text-5xl">
              VibeCheck vs {c.name}
            </h1>
            <p className="mt-4 text-base text-ink/70">{c.summary}</p>
          </div>

          <div className="mt-8 rounded-3xl bg-ink p-6 text-white shadow-lg sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
              The short version
            </p>
            <p className="font-serif mt-3 text-2xl leading-tight sm:text-3xl">{c.difference}</p>
          </div>

          {/* Comparison table */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-border/60">
            <div className="grid grid-cols-[1fr_1fr] bg-muted/40 text-xs font-semibold uppercase tracking-widest text-ink/55 sm:grid-cols-[1.1fr_1fr_1fr]">
              <div className="hidden px-4 py-3 sm:block" />
              <div className="px-4 py-3 text-purple-deep">VibeCheck</div>
              <div className="border-l border-border/60 px-4 py-3">{c.name}</div>
            </div>
            {c.rows.map((row) => (
              <div key={row.feature} className="border-t border-border/60">
                <div className="bg-muted/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink/50 sm:hidden">
                  {row.feature}
                </div>
                <div className="grid grid-cols-[1fr_1fr] text-sm sm:grid-cols-[1.1fr_1fr_1fr]">
                  <div className="hidden px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-ink/50 sm:block">
                    {row.feature}
                  </div>
                  <div className="px-4 py-3.5 font-medium text-ink/85">{row.us}</div>
                  <div className="border-l border-border/60 px-4 py-3.5 text-ink/60">{row.them}</div>
                </div>
              </div>
            ))}
          </div>

          {/* The honest half. Load-bearing: a comparison page that claims
              to win everything reads as an ad and converts badly. */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="font-serif text-xl">Pick {c.name} if…</h2>
              <ul className="mt-4 space-y-3">
                {c.betterForThem.map((item) => (
                  <li key={item} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 text-sm text-ink/75">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/30" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-purple/25 bg-purple-soft/40 p-5 shadow-sm">
              <h2 className="font-serif text-xl">Pick VibeCheck if…</h2>
              <ul className="mt-4 space-y-3">
                {c.betterForUs.map((item) => (
                  <li key={item} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 text-sm text-ink/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-ink/60">
            Plenty of people use both. They answer different questions.
          </p>

          {/* CTA */}
          <div className="mt-10 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm sm:p-8">
            <h2 className="font-serif text-2xl sm:text-3xl">See where you actually stand</h2>
            <p className="mt-2 text-sm text-ink/70">
              Six quick questions. Screenshots optional. Your first read is free.
            </p>
            <Link
              to="/quiz"
              onClick={() => trackEvent("cta_clicked", { position: `vs_${c.slug}` })}
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

          <p className="mt-6 text-center text-xs text-ink/45">
            Comparison reflects each product's stated positioning at time of writing. {c.name} is not affiliated
            with VibeCheck, and their features may have changed since.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
