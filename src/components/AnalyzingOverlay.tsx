import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ScanLine,
  Brain,
  Heart,
  MessageSquare,
  Flame,
  ShieldAlert,
  Zap,
  Eye,
  Check,
} from "lucide-react";

type Thumb = { previewUrl: string; name: string };

const STAGES = [
  { Icon: ScanLine, label: "Scanning every screenshot pixel by pixel" },
  { Icon: Eye, label: "Reading between the lines (yes, all of them)" },
  { Icon: MessageSquare, label: "Counting who texted first… awkward" },
  { Icon: Brain, label: "Consulting Gottman, Bowlby & your group chat" },
  { Icon: Flame, label: "Measuring flirt-to-dry ratio" },
  { Icon: ShieldAlert, label: "Sniffing out red flags & clown behavior" },
  { Icon: Heart, label: "Bottling the vibe into a verdict" },
];

const QUIPS = [
  "hold on… running the receipts 🧾",
  "we saw that 'k.' — logging it as evidence",
  "cross-referencing with every situationship of 2026",
  "asking the algorithm if this is love or boredom",
  "translating 'lol' into 12 possible emotions",
  "measuring dry replies in the metric system",
  "checking if they left you on read (or on delivered — worse)",
  "double-tapping their attachment style",
  "counting emojis. counting seconds. counting sins.",
  "consulting the group chat we're not in",
  "auditing the vibes. this may hurt a little.",
  "psychoanalyzing their punctuation choices",
  "the AI is judging. quietly. professionally.",
];

export function AnalyzingOverlay({ thumbs }: { thumbs: Thumb[] }) {
  const [progress, setProgress] = useState(6);
  const [quipIdx, setQuipIdx] = useState(0);

  // stage checklist is derived directly from progress — it advances once,
  // in lockstep with the bar, and holds on the last stage. no separate
  // timer means no risk of it looping back to the start mid-analysis.
  const stageIdx = Math.min(STAGES.length - 1, Math.floor((progress / 100) * STAGES.length));

  useEffect(() => {
    const iv = setInterval(
      () =>
        setProgress((p) => {
          // ease toward 96, never reach 100 until parent unmounts
          const delta = Math.max(0.4, (96 - p) * 0.045);
          return Math.min(p + delta, 96);
        }),
      380,
    );
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setQuipIdx((i) => (i + 1) % QUIPS.length), 2600);
    return () => clearInterval(iv);
  }, []);

  const visibleThumbs = useMemo(() => thumbs.slice(0, 4), [thumbs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-cream/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex min-h-full max-w-xl flex-col items-center px-5 py-10 text-center">
        {/* Pulsing orb */}
        <div className="relative grid h-36 w-36 place-items-center">
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-pink/40"
          />
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="relative grid h-24 w-24 place-items-center rounded-full bg-purple-soft"
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-pink text-white shadow-lg">
              <Heart className="h-7 w-7 fill-white" />
            </div>
          </motion.div>
        </div>

        <h1 className="font-serif mt-6 text-3xl leading-tight sm:text-4xl">
          reading the vibe…
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          takes ~30 seconds. don't close the tab — we're cooking 🔥
        </p>

        {/* Rotating quip */}
        <div className="relative mt-5 h-8 w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={quipIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 text-sm italic text-purple-deep"
            >
              {QUIPS[quipIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Thumbs being "scanned" */}
        {visibleThumbs.length > 0 && (
          <div className="mt-6 flex items-end justify-center gap-2">
            {visibleThumbs.map((t, i) => (
              <div
                key={i}
                className="relative h-24 w-16 overflow-hidden rounded-lg border border-border/60 bg-muted shadow-sm sm:h-28 sm:w-20"
              >
                <img
                  src={t.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: "100%" }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.25,
                  }}
                  className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-pink/70 to-transparent"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-pink/30" />
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-8 w-full">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-pink via-purple-deep to-pink bg-[length:200%_100%]"
              style={{
                animation: "vc-shimmer 2.4s linear infinite",
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-ink/60">
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-pink" />
              deep analysis in progress
            </span>
            <span className="font-medium text-ink">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Stage list */}
        <ul className="mt-8 w-full space-y-2 text-left">
          {STAGES.map((s, i) => {
            const active = i === stageIdx;
            const done = i < stageIdx;
            return (
              <motion.li
                key={s.label}
                animate={{
                  opacity: active ? 1 : done ? 0.75 : 0.4,
                  x: active ? 2 : 0,
                }}
                transition={{ duration: 0.3 }}
                className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2 ${
                  active ? "bg-purple-soft/70" : "bg-transparent"
                }`}
              >
                <div
                  className={`grid h-8 w-8 place-items-center rounded-lg ${
                    active
                      ? "bg-pink text-white"
                      : done
                        ? "bg-mint text-white"
                        : "bg-muted text-ink/50"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <s.Icon className="h-4 w-4" />}
                </div>
                <span className="min-w-0 truncate text-sm text-ink/80">{s.label}</span>
                {active && (
                  <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-pink" />
                )}
              </motion.li>
            );
          })}
        </ul>

        <p className="mt-8 max-w-sm text-xs text-ink/50">
          fun fact: the average situationship generates 47% more red flags than a real relationship. we're counting yours now 👀
        </p>
      </div>

      <style>{`
        @keyframes vc-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </motion.div>
  );
}
