import {
  Activity, Building2, Cpu, Droplet, Factory, Flame, Gauge, Hammer, HeartPulse, Magnet, Ruler, ShieldCheck, Thermometer,
  ThermometerSun, Truck, Wind, Wrench, Zap, Package, type LucideProps,
} from "lucide-react";

const ICONS = {
  zap: Zap, gauge: Gauge, magnet: Magnet, "shield-check": ShieldCheck, cpu: Cpu, activity: Activity, wrench: Wrench,
  ruler: Ruler, hammer: Hammer, wind: Wind, "thermometer-sun": ThermometerSun, "heart-pulse": HeartPulse,
  thermometer: Thermometer, droplet: Droplet, factory: Factory, building: Building2, truck: Truck, flame: Flame,
} as const;

export function CategoryIcon({ name, ...props }: { name?: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] || Package;
  return <Icon strokeWidth={1.4} aria-hidden {...props} />;
}

// Kanji for each product family, used as large typographic marks.
export const FAMILY_KANJI: Record<string, string> = {
  "electrical-test-measurement": "電", "electronics-laboratory": "基", "industrial-measurement": "測",
  "industrial-tools": "具", "environmental-monitoring": "環", "medical-diagnostic": "医", "fire-protection-building-services": "防",
};
export const familyKanji = (slug: string) => FAMILY_KANJI[slug] || "工";
const FAMILY_WORD: Record<string, string> = {
  "electrical-test-measurement": "電気計測", "electronics-laboratory": "電子機器", "industrial-measurement": "精密計測",
  "industrial-tools": "工具", "environmental-monitoring": "環境測定", "medical-diagnostic": "医療機器", "fire-protection-building-services": "防災設備",
};
export const familyWord = (slug: string) => FAMILY_WORD[slug] || "精密";

// The mark: a red measurement point on a hairline reticle.
export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M16 1v9M16 22v9M1 16h9M22 16h9" stroke="currentColor" strokeWidth="1.25" />
      <rect x="11.5" y="11.5" width="9" height="9" fill="var(--color-beni)" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string; tone?: "ink" | "paper" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-ink ${className}`}>
      <Mark className="h-7 w-7 shrink-0" />
      <span className="text-[0.95rem] font-semibold tracking-[0.16em] sm:text-[1.02rem]">OSAKA TOOL</span>
    </span>
  );
}
