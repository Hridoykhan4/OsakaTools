// A measurement scale drawn as a technical illustration. The needle is driven by scroll
// (see HomeMotion, data-needle); it represents the act of measuring, not a product reading.
export default function Gauge({ className = "" }: { className?: string }) {
  const ticks = Array.from({ length: 61 }, (_, i) => i);
  const angle = (i: number) => (-210 + (i / 60) * 240) * (Math.PI / 180);
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Measurement scale illustration">
      <circle cx="200" cy="200" r="178" fill="none" stroke="var(--color-line)" />
      <circle cx="200" cy="200" r="150" fill="none" stroke="var(--color-line-2)" />
      {ticks.map((i) => {
        const a = angle(i), major = i % 10 === 0, mid = i % 5 === 0;
        const r1 = 168, r2 = major ? 142 : mid ? 152 : 158;
        return <line key={i} x1={200 + r1 * Math.cos(a)} y1={200 + r1 * Math.sin(a)} x2={200 + r2 * Math.cos(a)} y2={200 + r2 * Math.sin(a)}
          stroke={i >= 50 ? "var(--color-beni)" : "var(--color-ink)"} strokeWidth={major ? 1.6 : 0.8} />;
      })}
      {ticks.filter((i) => i % 10 === 0).map((i) => {
        const a = angle(i);
        return <text key={i} x={200 + 122 * Math.cos(a)} y={200 + 122 * Math.sin(a) + 4} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill="var(--color-mute)">{i / 10}</text>;
      })}
      <text x="200" y="268" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--color-faint)" letterSpacing="2">CAL. RANGE</text>
      <g data-needle>
        <line x1="200" y1="200" x2="200" y2="62" stroke="var(--color-beni)" strokeWidth="2" strokeLinecap="round" />
        <line x1="200" y1="200" x2="200" y2="228" stroke="var(--color-beni)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="200" cy="200" r="7" fill="#fff" stroke="var(--color-ink)" strokeWidth="1.5" />
    </svg>
  );
}
