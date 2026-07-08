import type { ViralKeyword } from "@/lib/vibecheck-schema";

// Deterministic pseudo-random from a string seed — same pattern used by the
// Vibe Decay sparkline. Keeps the cloud's "randomness" stable across
// re-renders instead of reshuffling every time React repaints.
function seededRand(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffff) / 0xffff;
  };
}

const SIZE_CLASSES = ["text-xl sm:text-2xl", "text-2xl sm:text-3xl", "text-3xl sm:text-4xl", "text-4xl sm:text-5xl"];

function toneClasses(type: ViralKeyword["type"]) {
  if (type === "green_flag") return "text-mint";
  if (type === "red_flag") return "text-destructive";
  return "text-ink/60";
}

export function WordCloud({ keywords }: { keywords: ViralKeyword[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 px-2 py-6">
      {keywords.map((k, i) => {
        const rand = seededRand(`${k.word}|${i}`);
        // First two keywords (usually the most impactful, per the report
        // prompt's ordering) get weighted toward the larger end of the
        // scale so the cloud reads as ranked, not uniform.
        const weight = i < 2 ? 0.5 + rand() * 0.5 : rand() * 0.75;
        const sizeIdx = Math.min(SIZE_CLASSES.length - 1, Math.floor(weight * SIZE_CLASSES.length));
        const rotation = Math.round((rand() - 0.5) * 16);
        return (
          <span
            key={i}
            className={`font-serif leading-none ${SIZE_CLASSES[sizeIdx]} ${toneClasses(k.type)}`}
            style={{ transform: `rotate(${rotation}deg)` }}
            title={k.impact}
          >
            {k.word}
          </span>
        );
      })}
    </div>
  );
}
