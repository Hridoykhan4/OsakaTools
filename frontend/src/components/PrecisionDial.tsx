// Hero visual: an engineered measurement dial drawn in SVG. Rotation is CSS-only,
// GPU-cheap, and disabled automatically for reduced-motion users.
export default function PrecisionDial({ className = "" }: { className?: string }) {
  const ticks = Array.from({ length: 120 }, (_, i) => i);
  const labels = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg viewBox="0 0 600 600" className={className} role="img" aria-label="Precision measurement dial">
      <defs>
        <radialGradient id="disc" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ebe8e0" />
        </radialGradient>
        <linearGradient id="needle" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--color-beni)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--color-beni)" />
        </linearGradient>
      </defs>
      <circle cx="300" cy="300" r="292" fill="none" stroke="var(--color-line)" />
      <circle cx="300" cy="300" r="260" fill="url(#disc)" stroke="var(--color-line)" />

      <g className="origin-center animate-spin-slow" style={{ transformBox: "fill-box" }}>
        {ticks.map((i) => {
          const major = i % 10 === 0;
          const mid = i % 5 === 0;
          return (
            <line key={i} x1="300" y1={major ? 46 : mid ? 54 : 58} x2="300" y2="66"
              stroke={major ? "var(--color-ink)" : "var(--color-silver)"} strokeWidth={major ? 1.6 : 1}
              transform={`rotate(${i * 3} 300 300)`} />
          );
        })}
      </g>

      <g className="origin-center animate-spin-rev" style={{ transformBox: "fill-box" }}>
        <circle cx="300" cy="300" r="200" fill="none" stroke="var(--color-ink)" strokeOpacity=".18" strokeDasharray="2 7" />
        {labels.map((i) => (
          <text key={i} x="300" y="122" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-mute)"
            transform={`rotate(${i * 30} 300 300)`}>{String(i * 30).padStart(3, "0")}</text>
        ))}
      </g>

      <circle cx="300" cy="300" r="150" fill="none" stroke="var(--color-line)" />
      <circle cx="300" cy="300" r="96" fill="var(--color-beni)" />
      <circle cx="300" cy="300" r="96" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="14" />
      <path d="M150 300 H450 M300 150 V450" stroke="var(--color-ink)" strokeOpacity=".35" strokeWidth=".8" />
      <g style={{ transformOrigin: "300px 300px" }} className="animate-[spin_18s_cubic-bezier(.6,0,.4,1)_infinite]">
        <rect x="300" y="298.5" width="230" height="3" fill="url(#needle)" />
        <circle cx="530" cy="300" r="4" fill="var(--color-beni)" />
      </g>
      <circle cx="300" cy="300" r="7" fill="var(--color-ink)" />
      <text x="300" y="560" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="4" fill="var(--color-faint)">MEASURE · VERIFY · DOCUMENT</text>
    </svg>
  );
}
