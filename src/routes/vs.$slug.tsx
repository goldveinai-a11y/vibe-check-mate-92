import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, Check, X, Scale } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCompetitor, type Competitor } from "@/lib/competitors";
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

          {/* Split into two halves so the contrast is visual, not just
              textual - the thing they do, dimmed; the thing we do, bright.
              The old single grey paragraph made both sides read as equally
              weighted, which is the opposite of what a comparison page is
              for. */}
          <div className="mt-8 overflow-hidden rounded-3xl bg-ink text-white shadow-lg">
            <div className="border-b border-white/10 p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                {c.name} answers
              </p>
              <p className="font-serif mt-2 text-2xl leading-tight text-white/55">{c.difference.split(". ")[0]}.</p>
            </div>
            <div className="bg-pink p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                VibeCheck answers
              </p>
              <p className="font-serif mt-2 text-2xl leading-tight sm:text-3xl">
                {c.difference.split(". ").slice(1).join(". ")}
              </p>
            </div>
          </div>

          {/* One card per comparison point, ours always first and visually
              dominant. The earlier version was a real two-column table,
              which collapsed into an unreadable mess on a phone - a full
              width label strip, then two thin columns of grey text with
              nothing marking which side was ours. Since almost all traffic
              here is mobile, the card layout IS the layout; on wider
              screens the two halves simply sit side by side. */}
          <div className="mt-8 space-y-3">
            {c.rows.map((row: Competitor["rows"][number]) => (
              <div key={row.feature} className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/45">{row.feature}</p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-purple/25 bg-purple-soft/50 p-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-purple-deep">
                      <Check className="h-3.5 w-3.5" />
                      VibeCheck
                    </div>
                    <p className="mt-2 text-[15px] font-medium leading-snug text-ink">{row.us}</p>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-muted/25 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ink/40">{c.name}</p>
                    <p className="mt-2 text-[15px] leading-snug text-ink/55">{row.them}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* The honest half. Load-bearing: a comparison page that claims
              to win everything reads as an ad and converts badly. */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="order-2 rounded-3xl border border-border/50 bg-muted/25 p-5 sm:order-1">
              <h2 className="font-serif text-xl text-ink/70">Pick {c.name} if…</h2>
              <ul className="mt-4 space-y-3">
                {c.betterForThem.map((item: string) => (
                  <li key={item} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 text-sm text-ink/75">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/30" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Ours first on mobile - on a phone these stack, and the one
                people read is the one on top. */}
            <div className="order-1 rounded-3xl border-2 border-purple/30 bg-purple-soft/60 p-5 shadow-sm sm:order-2">
              <h2 className="font-serif text-xl text-purple-deep">Pick VibeCheck if…</h2>
              <ul className="mt-4 space-y-3">
                {c.betterForUs.map((item: string) => (
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
