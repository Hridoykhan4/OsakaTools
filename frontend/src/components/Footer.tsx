import Link from "next/link";
import { Logo } from "./brand";
import { site } from "@/lib/site";

const COLUMNS = [
  { title: "Products", links: [
    ["Electrical test & measurement", "/categories/electrical-test-measurement"], ["Electronics & laboratory", "/categories/electronics-laboratory"],
    ["Industrial measurement", "/categories/industrial-measurement"], ["Industrial tools", "/categories/industrial-tools"],
    ["Environmental monitoring", "/categories/environmental-monitoring"], ["Medical & diagnostic", "/categories/medical-diagnostic"],
  ] },
  { title: "Company", links: [["About OSAKA TOOL", "/about"], ["Technology & engineering", "/technology"], ["Quality & documentation", "/quality"], ["Global distribution", "/distribution"]] },
  { title: "Buy", links: [["Request a quote", "/rfq"], ["Compare products", "/compare"], ["Industry applications", "/industries"], ["Contact sales", "/contact"]] },
  { title: "Learn", links: [["Technical resources", "/resources"], ["Measurement categories", "/resources/multimeter-measurement-categories-cat-ii-iii-iv-explained"], ["Oscilloscope selection", "/resources/choosing-an-oscilloscope-bandwidth-sample-rate-memory"]] },
] as const;

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="shell grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo tone="paper" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-silver">
            Precision instruments and technical products for professional buyers, specified with complete data and supplied with documentation.
          </p>
          <a href={`mailto:${site.email}`} className="mt-6 inline-block font-mono text-sm text-paper underline decoration-beni underline-offset-4">{site.email}</a>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-faint">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}><Link href={href} className="text-sm text-steel/90 transition hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-3 py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. Product names and trademarks belong to their respective manufacturers.</p>
          <p className="font-mono tracking-[0.2em]">精密 · PRECISION</p>
        </div>
      </div>
    </footer>
  );
}
