import Link from "next/link";
import { Logo } from "./brand";
import { site } from "@/lib/site";
import type { SiteSettings } from "@/lib/types";

const COLUMNS = [
  { title: "Products", links: [
    ["Electrical test & measurement", "/categories/electrical-test-measurement"], ["Electronics & laboratory", "/categories/electronics-laboratory"],
    ["Industrial measurement", "/categories/industrial-measurement"], ["Industrial tools", "/categories/industrial-tools"],
    ["Fire protection & building services", "/categories/fire-protection-building-services"], ["Medical & diagnostic", "/categories/medical-diagnostic"],
  ] },
  { title: "Company", links: [["About OSAKA TOOL", "/about"], ["Technology & engineering", "/technology"], ["Quality & documentation", "/quality"], ["Global distribution", "/distribution"]] },
  { title: "Buy", links: [["Request a quote", "/rfq"], ["Compare products", "/compare"], ["Industry applications", "/industries"], ["Contact sales", "/contact"]] },
  { title: "Learn", links: [["Technical resources", "/resources"], ["Measurement categories", "/resources/multimeter-measurement-categories-cat-ii-iii-iv-explained"], ["Oscilloscope selection", "/resources/choosing-an-oscilloscope-bandwidth-sample-rate-memory"]] },
] as const;

const SOCIAL: [keyof SiteSettings["social"], string][] = [["linkedin", "LinkedIn"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["x", "X"]];

export default function Footer({ settings }: { settings?: SiteSettings }) {
  const email = settings?.contact.email || site.email;
  const social = SOCIAL.filter(([k]) => settings?.social[k]);
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line bg-white">
      <div className="shell grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-2">
            Precision instruments and technical products for professional buyers, specified with complete data and supplied with documentation.
          </p>
          <div className="mt-6 space-y-1.5 text-sm">
            <a href={`mailto:${email}`} className="block font-medium underline decoration-beni underline-offset-4 hover:text-beni">{email}</a>
            {settings?.contact.phone && <a href={`tel:${settings.contact.phone.replace(/[^+\d]/g, "")}`} className="block text-ink-2 hover:text-beni">{settings.contact.phone}</a>}
            {settings?.contact.whatsapp && <a href={`https://wa.me/${settings.contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="block text-ink-2 hover:text-beni">WhatsApp {settings.contact.whatsapp}</a>}
            {settings?.contact.address && <p className="whitespace-pre-line text-mute">{settings.contact.address}</p>}
          </div>
          {social.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {social.map(([k, label]) => (
                <li key={k}><a href={settings!.social[k]} target="_blank" rel="noopener" className="inline-block rounded-full border border-line bg-white px-3 py-1 text-xs hover:border-beni hover:text-beni">{label}</a></li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-faint">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}><Link href={href} className="text-sm text-ink-2 transition hover:text-beni">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Monumental wordmark, cropped by the page edge. */}
      <div aria-hidden className="overflow-hidden">
        <p className="shell select-none whitespace-nowrap text-[18.5vw] font-semibold leading-[0.74] tracking-[-0.06em] text-ink/[0.06]">OSAKA TOOL</p>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-3 py-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. Product names and trademarks belong to their respective manufacturers.</p>
          <p>Light, precise, documented.</p>
        </div>
      </div>
    </footer>
  );
}
