import { forwardRef } from "react";
import { Sparkles } from "lucide-react";

export type ShareCardData = {
  award: { title: string; subtitle: string } | null;
  popCulture: { couple: string; source: string } | null;
  overallScore: number;
  headline: string;
};

// 1080x1920 canvas (rendered at that pixel size for export).
export const ShareCard = forwardRef<HTMLDivElement, { data: ShareCardData }>(
  function ShareCard({ data }, ref) {
    return (
      <div
        ref={ref}
        style={{ width: 1080, height: 1920 }}
        className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-pink via-purple to-ink p-20 text-white"
      >
        <div className="flex items-center gap-3 text-white/80">
          <Sparkles className="h-8 w-8" />
          <span className="font-serif text-3xl tracking-tight">VibeCheck</span>
        </div>

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

        <div className="text-center text-2xl text-white/80">
          get your own read → <span className="font-semibold text-white">vibecheck.app</span>
        </div>
      </div>
    );
  },
);

export async function exportShareCard(node: HTMLElement, filename = "vibecheck.png") {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 1 });

  // Try native share with file
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

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}