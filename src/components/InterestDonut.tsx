import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";

export function InterestDonut({ value, size = 208 }: { value: number; size?: number }) {
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c * (1 - clamped / 100);
  // Seed with the real clamped value so first paint (and any pre-hydration
  // screenshot) shows the correct percentage instead of 0%. The count-up
  // animation below is purely cosmetic on top of the already-correct value.
  const mv = useMotionValue(clamped);
  const [display, setDisplay] = useState(clamped);
  useEffect(() => {
    const controls = animate(mv, clamped, { duration: 1.2, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [clamped, mv]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--pink)" />
            <stop offset="100%" stopColor="var(--purple)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--muted)"
          strokeWidth={stroke}
          fill="none"
          opacity={0.4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#donut-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        {/* The caption's wide letter-spacing (0.28em) made "their interest
            in you" render wider than the ring's inner diameter on a single
            line, so it visually ran onto the stroke itself. Capping the
            width forces a clean 2-line wrap that stays inside the ring,
            and the tighter tracking gives it more room to spare. */}
        <div className="text-center">
          <div className="font-serif text-6xl leading-none text-ink sm:text-7xl tabular-nums">
            {display}%
          </div>
          <div className="mx-auto mt-2 max-w-[7.5rem] text-[10px] uppercase leading-tight tracking-[0.14em] text-ink/60">
            their interest in you
          </div>
        </div>
      </div>
    </div>
  );
}