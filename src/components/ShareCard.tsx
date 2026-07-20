import { forwardRef } from "react";
import { Sparkles, Flame, Heart, MessageCircle, AlertTriangle, Award as AwardIcon, Film } from "lucide-react";
import type { ViralKeyword } from "@/lib/vibecheck-schema";

export type ShareCardVariant = "hero" | "wordcloud" | "threewords" | "badge" | "verdict" | "award" | "popculture";

export type VerdictTone = "hot" | "warm" | "caution" | "neutral" | "cold" | "danger";

export type ShareCardData = {
  award: { title: string; subtitle: string } | null;
  popCulture: { couple: string; source: string; explanation?: string } | null;
  overallScore: number;
  headline: string;
  // verdict-only extras - the tone/tag/blurb driving the /results/$id hero
  // card's own color and copy, so the exported card matches the page
  // instead of every variant defaulting to the same pink-purple-ink look.
  tone?: VerdictTone;
  tag?: string;
  blurb?: string;
  keywords?: ViralKeyword[];
  threeWords?: string[];
};

// Mirrors VERDICT_STYLES in results.$id.tsx (same tone -> color mapping the
// on-page hero card uses) via the site's own CSS vars, so a "Red Flag Zone"
// share always renders red/coral, not the same purple every other card
// used to default to regardless of what it was actually reporting.
const TONE_STYLES: Record<VerdictTone, { gradient: string; icon: typeof Flame }> = {
  hot: { gradient: "linear-gradient(160deg, var(--pink), var(--ink) 120%)", icon: Flame },
  warm: { gradient: "linear-gradient(160deg, var(--pink), var(--ink) 120%)", icon: Heart },
  caution: { gradient: "linear-gradient(160deg, var(--purple), var(--ink) 120%)", icon: Sparkles },
  neutral: { gradient: "linear-gradient(160deg, var(--mint), var(--ink) 120%)", icon: Sparkles },
  cold: { gradient: "linear-gradient(160deg, var(--ink), #000 120%)", icon: MessageCircle },
  danger: { gradient: "linear-gradient(160deg, var(--destructive), var(--ink) 120%)", icon: AlertTriangle },
};

const FOOTER = (
  <div className="text-center">
    <div className="text-2xl text-white/80">
      get your own read → <span className="font-semibold text-white">vibecheck.app</span>
    </div>
    <div className="mt-3 text-base text-white/50">
      AI-generated read · no screenshots included or ever stored
    </div>
  </div>
);

const LOGO = (
  <div className="flex items-center gap-3 text-white/80">
    <Sparkles className="h-8 w-8" />
    <span className="font-serif text-3xl tracking-tight">VibeCheck</span>
  </div>
);

function keywordTone(type: ViralKeyword["type"]) {
  if (type === "green_flag") return "text-emerald-200";
  if (type === "red_flag") return "text-rose-200";
  return "text-white/70";
}

// 1080x1920 canvas (rendered at that pixel size for export) — sized for
// Instagram/TikTok Stories. Three variants share the same frame/footer so
// a user can post whichever result landed hardest, not just the one
// combined card the report originally shipped with.
export const ShareCard = forwardRef<HTMLDivElement, { data: ShareCardData; variant?: ShareCardVariant }>(
  function ShareCard({ data, variant = "hero" }, ref) {
    if (variant === "wordcloud") {
      const keywords = data.keywords ?? [];
      return (
        <div
          ref={ref}
          style={{ width: 1080, height: 1920 }}
          className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-ink via-purple to-pink p-20 text-white"
        >
          {LOGO}
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="mb-8 text-sm uppercase tracking-[0.35em] text-white/70">Words That Moved the Needle</div>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 px-4">
              {keywords.slice(0, 6).map((k, i) => (
                <span
                  key={i}
                  className={`font-serif leading-none ${keywordTone(k.type)}`}
                  style={{ fontSize: i < 2 ? 96 : i < 4 ? 68 : 48 }}
                >
                  "{k.word}"
                </span>
              ))}
            </div>
          </div>
          {FOOTER}
        </div>
      );
    }

    if (variant === "badge") {
      // Square format (not the 1080x1920 story canvas) — sized for a
      // Tinder/Hinge profile photo slot or Instagram grid post, not Stories.
      // Meant to be posted/added as a "certified" sticker, not read as a report.
      return (
        <div
          ref={ref}
          style={{ width: 1080, height: 1080 }}
          className="relative flex flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-pink via-purple to-ink p-16 text-white"
        >
          {LOGO}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="grid place-items-center rounded-full bg-white text-ink" style={{ width: 280, height: 280 }}>
              <div className="text-center">
                <div className="font-serif text-8xl leading-none">{data.overallScore}%</div>
                <div className="mt-1 text-sm uppercase tracking-[0.25em] text-ink/60">Vibe Score</div>
              </div>
            </div>
            {data.award && (
              <div className="rounded-[32px] bg-white/10 px-10 py-6 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.3em] text-white/70">VibeCheck Certified</div>
                <div className="font-serif mt-2 text-4xl leading-tight">{data.award.title}</div>
              </div>
            )}
          </div>
          <div className="text-center text-xl text-white/60">
            get your read → <span className="font-semibold text-white/90">vibecheck.app</span>
          </div>
        </div>
      );
    }

    if (variant === "threewords") {
      const words = data.threeWords ?? [];
      return (
        <div
          ref={ref}
          style={{ width: 1080, height: 1920 }}
          className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-purple via-pink to-ink p-20 text-white"
        >
          {LOGO}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="text-sm uppercase tracking-[0.35em] text-white/70">Their Type in 3 Words</div>
            {words.map((w, i) => (
              <div key={i} className="font-serif text-7xl leading-none">{w}</div>
            ))}
          </div>
          {FOOTER}
        </div>
      );
    }

    // Isolated to JUST the headline verdict (e.g. "Red Flag Zone") + overall
    // score — no award, no pop-culture match mixed in. Background color is
    // driven by data.tone, mirroring VERDICT_STYLES on the page itself, so
    // a "Red Flag Zone" share actually reads as red/alarming instead of
    // the same generic purple every card used to default to. Also carries
    // the tag + blurb text so the card explains itself without the page.
    if (variant === "verdict") {
      const tone = data.tone ?? "caution";
      const style = TONE_STYLES[tone];
      const ToneIcon = style.icon;
      return (
        <div
          ref={ref}
          style={{ width: 1080, height: 1920, background: style.gradient }}
          className="relative flex flex-col justify-between overflow-hidden p-20 text-white"
        >
          {LOGO}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            {data.tag && (
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/20 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em]">
                <ToneIcon className="h-5 w-5" />
                {data.tag}
              </div>
            )}
            <div className="font-serif text-6xl leading-[1.05]">{data.headline}</div>
            {data.blurb && (
              <p className="max-w-xl text-2xl leading-relaxed text-white/85">{data.blurb}</p>
            )}
            <div className="grid place-items-center rounded-full bg-white text-ink" style={{ width: 320, height: 320 }}>
              <div className="text-center">
                <div className="font-serif text-8xl leading-none">{data.overallScore}%</div>
                <div className="mt-2 text-base uppercase tracking-[0.3em] text-ink/60">Overall Vibe</div>
              </div>
            </div>
          </div>
          {FOOTER}
        </div>
      );
    }

    // Isolated to JUST the Vibe Award (title + subtitle) + overall score —
    // no pop-culture match, no verdict headline mixed in. Warm gold/amber
    // treatment (distinct from every other variant's palette) so this
    // reads as a "prize" being handed out, not another pink-purple card.
    if (variant === "award") {
      return (
        <div
          ref={ref}
          style={{ width: 1080, height: 1920, background: "linear-gradient(160deg, #4A1B0C 0%, #712B13 45%, #BA7517 100%)" }}
          className="relative flex flex-col justify-between overflow-hidden p-20 text-white"
        >
          {LOGO}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <AwardIcon className="h-16 w-16" />
            {data.award && (
              <div>
                <div className="text-sm uppercase tracking-[0.35em] text-white/70">Vibe Award</div>
                <div className="font-serif mt-4 text-6xl leading-[1.05]">{data.award.title}</div>
                <div className="mt-5 text-2xl text-white/85">{data.award.subtitle}</div>
              </div>
            )}
            <div className="grid place-items-center rounded-full bg-white text-ink" style={{ width: 320, height: 320 }}>
              <div className="text-center">
                <div className="font-serif text-8xl leading-none">{data.overallScore}%</div>
                <div className="mt-2 text-base uppercase tracking-[0.3em] text-ink/60">Overall Vibe</div>
              </div>
            </div>
          </div>
          {FOOTER}
        </div>
      );
    }

    // Isolated to JUST the pop-culture match (couple + source + why) +
    // overall score — no award, no verdict headline mixed in. Deep
    // blue/indigo "cinematic" treatment (distinct from every other
    // variant) since this card is explicitly a movie/show reference.
    if (variant === "popculture") {
      return (
        <div
          ref={ref}
          style={{ width: 1080, height: 1920, background: "linear-gradient(160deg, #042C53 0%, #0C447C 50%, #3C3489 100%)" }}
          className="relative flex flex-col justify-between overflow-hidden p-20 text-white"
        >
          {LOGO}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <Film className="h-14 w-14" />
            <div className="text-sm uppercase tracking-[0.35em] text-white/70">You're Giving...</div>
            {data.popCulture && (
              <>
                <div className="font-serif text-6xl leading-tight">{data.popCulture.couple}</div>
                <div className="text-xl uppercase tracking-[0.25em] text-white/60">from {data.popCulture.source}</div>
                {data.popCulture.explanation && (
                  <p className="max-w-xl text-xl leading-relaxed text-white/85">{data.popCulture.explanation}</p>
                )}
              </>
            )}
            <div className="grid place-items-center rounded-full bg-white text-ink" style={{ width: 280, height: 280 }}>
              <div className="text-center">
                <div className="font-serif text-7xl leading-none">{data.overallScore}%</div>
                <div className="mt-1 text-sm uppercase tracking-[0.25em] text-ink/60">Overall Vibe</div>
              </div>
            </div>
          </div>
          {FOOTER}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        style={{ width: 1080, height: 1920 }}
        className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-pink via-purple to-ink p-20 text-white"
      >
        {LOGO}

        <div className="flex flex-col items-center gap-10 text-center">
          {data.award && (
            <div className="rounded-[40px] bg-white/10 px-14 py-10 backdrop-blur-sm">
              <div className="text-sm uppercase tracking-[0.35em] text-white/70">Vibe Award</div>
              <div className="font-serif mt-4 text-6xl leading-[1.05]">{data.award.title}</div>
              <div className="mt-5 text-2xl text-white/85">{data.award.subtitle}</div>
            </div>
          )}

          <div className="grid place-items-center rounded-full bg-white text-ink" style={{ width: 360, height: 360 }}>
            <div className="text-center">
              <div className="font-serif text-9xl leading-none">{data.overallScore}%</div>
              <div className="mt-2 text-lg uppercase tracking-[0.3em] text-ink/60">Overall Vibe</div>
            </div>
          </div>

          <div className="font-serif text-5xl leading-tight">{data.headline}</div>

          {data.popCulture && (
            <div className="text-2xl text-white/85">
              you're giving <span className="font-semibold text-white">{data.popCulture.couple}</span> · {data.popCulture.source}
            </div>
          )}
        </div>

        {FOOTER}
      </div>
    );
  },
);

export async function exportShareCard(node: HTMLElement, filename = "vibecheck.png") {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 1 });

  // Only offer the native OS share sheet (AirDrop / Mail / Messages / ...)
  // on mobile - that's where "Share to Stories" actually makes sense.
  // Desktop Chrome/Safari also technically support navigator.share for
  // files, but popping the macOS/Windows share panel there is confusing:
  // a desktop user clicking "Share" expects the PNG to land in Downloads,
  // not a picker full of Mail/Messages/AirDrop targets they didn't ask
  // for and usually can't even use meaningfully from a laptop.
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: "My VibeCheck" });
        return;
      }
    } catch {
      // fall through to download
    }
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
