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

// The mark: the sun on the horizon — a hinomaru disc above a precision rule.
export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="17" r="10.5" fill="var(--color-beni)" />
      <path d="M4 30.5h32" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 35h20" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// Hanko: a red seal reading 大阪 / 工具 (Osaka / tools).
export function Hanko({ className = "h-14 w-14", label = ["大", "阪", "工", "具"] }: { className?: string; label?: string[] }) {
  return (
    <svg viewBox="0 0 60 60" className={className} role="img" aria-label="OSAKA TOOL seal">
      <rect x="3" y="3" width="54" height="54" rx="5" fill="var(--color-beni)" />
      <rect x="7" y="7" width="46" height="46" rx="3" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".9" />
      {/* Read top-to-bottom, right column first, as a traditional seal. */}
      <g fill="#fff" fontFamily="var(--font-mincho)" fontWeight="800" fontSize="19" textAnchor="middle">
        <text x="40" y="27">{label[0]}</text><text x="40" y="47">{label[1]}</text>
        <text x="20" y="27">{label[2]}</text><text x="20" y="47">{label[3]}</text>
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string; tone?: "ink" | "paper" }) {
  return (
    <span className={`inline-flex items-center gap-2 text-ink sm:gap-3 ${className}`}>
      <Mark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
      <span className="flex flex-col leading-none">
        <span className="font-mincho text-[1.05rem] font-extrabold tracking-[0.1em] sm:text-[1.15rem] sm:tracking-[0.16em]">OSAKA TOOL</span>
        <span className="mt-1 font-mincho text-[0.62rem] tracking-[0.5em] text-mute">大阪ツール</span>
      </span>
    </span>
  );
}
