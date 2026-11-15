import {
  Activity, Building2, Cpu, Droplet, Factory, Gauge, Hammer, HeartPulse, Magnet, Ruler, ShieldCheck, Thermometer,
  ThermometerSun, Truck, Wind, Wrench, Zap, Package, type LucideProps,
} from "lucide-react";

const ICONS = {
  zap: Zap, gauge: Gauge, magnet: Magnet, "shield-check": ShieldCheck, cpu: Cpu, activity: Activity, wrench: Wrench,
  ruler: Ruler, hammer: Hammer, wind: Wind, "thermometer-sun": ThermometerSun, "heart-pulse": HeartPulse,
  thermometer: Thermometer, droplet: Droplet, factory: Factory, building: Building2, truck: Truck,
} as const;

export function CategoryIcon({ name, ...props }: { name?: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] || Package;
  return <Icon strokeWidth={1.4} aria-hidden {...props} />;
}

// The mark: a beni-red disc crossed by a precision reticle line.
export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="11" fill="var(--color-beni)" />
      <path d="M2 20h11M27 20h11M20 2v6M20 32v6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="17.3" fill="none" stroke="currentColor" strokeWidth=".8" strokeDasharray="1.2 3.2" />
    </svg>
  );
}

export function Logo({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "paper" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${tone === "paper" ? "text-paper" : "text-ink"} ${className}`}>
      <Mark className="h-8 w-8 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-[1.05rem] font-semibold tracking-[0.22em]">OSAKA TOOL</span>
        <span className="mt-1 font-jp text-[0.6rem] tracking-[0.42em] opacity-60">オーサカツール</span>
      </span>
    </span>
  );
}
