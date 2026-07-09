import { motion } from "framer-motion";

export type RadarMetric = { label: string; value: number };

export function CompatibilityRadar({
  metrics,
  size = 320,
}: {
  metrics: RadarMetric[];
  size?: number;
}) {
  // Axis labels (e.g. "RECIPROCITY", "NON-TOXIC") are drawn past the radius
  // of the shape itself, and the longest ones don't fit between the last
  // vertex and the edge of a viewBox sized to exactly `size` — they were
  // getting silently clipped by the SVG's own bounds (e.g. "NON-TOXIC"
  // rendering as "ON-TOXIC"). Widening the viewBox/canvas horizontally
  // (labels only overflow sideways, not vertically) gives them breathing
  // room without changing the plotted shape's actual size.
  const labelPad = 72;
  const width = size + labelPad * 2;
  const cx = width / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const n = metrics.length;

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, r: number) => {
    const a = angle(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };

  const gridPolys = [0.33, 0.66, 1].map((f) =>
    metrics
      .map((_, i) => {
        const [x, y] = point(i, maxR * f);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" "),
  );

  const dataPoints = metrics.map((m, i) => {
    const clamped = Math.max(0, Math.min(100, m.value));
    return point(i, maxR * (clamped / 100));
  });
  const dataPoly = dataPoints
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const centerPoly = metrics.map(() => `${cx},${cy}`).join(" ");

  return (
    <div className="mx-auto" style={{ width, height: size }}>
      <svg width={width} height={size} viewBox={`0 0 ${width} ${size}`}>
        <defs>
          <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--pink)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--purple)" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="radar-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--pink)" />
            <stop offset="100%" stopColor="var(--purple)" />
          </linearGradient>
        </defs>

        {gridPolys.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.7}
          />
        ))}

        {metrics.map((_, i) => {
          const [x, y] = point(i, maxR);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        <motion.polygon
          initial={{ points: centerPoly, opacity: 0 }}
          animate={{ points: dataPoly, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          fill="url(#radar-fill)"
          stroke="url(#radar-stroke)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {dataPoints.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill="var(--card)"
            stroke="url(#radar-stroke)"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + i * 0.05, duration: 0.3 }}
          />
        ))}

        {metrics.map((m, i) => {
          const [x, y] = point(i, maxR + 22);
          const anchor = Math.abs(x - cx) < 4 ? "middle" : x > cx ? "start" : "end";
          return (
            <g key={i}>
              <text
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-current text-[10px] uppercase tracking-widest"
                fill="var(--ink)"
                opacity={0.6}
              >
                {m.label}
              </text>
              <text
                x={x}
                y={y + 12}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill="var(--purple)"
                className="font-serif"
                style={{ fontSize: 14 }}
              >
                {Math.round(m.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}