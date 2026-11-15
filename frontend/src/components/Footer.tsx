import Link from "next/link";
import { Hanko, Logo } from "./brand";
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
    <footer className="relative mt-28 overflow-hidden border-t border-line bg-paper-2">
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
              <p className="font-mincho text-sm font-semibold">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}><Link href={href} className="text-sm text-ink-2 transition hover:text-beni">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Monumental wordmark, cut off by the page edge like a stamp pressed past the paper. */}
      <div aria-hidden className="shell relative flex items-end justify-between gap-6">
        <p className="min-w-0 flex-1 select-none overflow-hidden whitespace-nowrap font-mincho text-[17vw] font-extrabold leading-[0.78] tracking-[-0.02em] text-ink/[0.07] lg:text-[13.5rem]">OSAKA TOOL</p>
        <Hanko className="mb-6 hidden h-20 w-20 shrink-0 -rotate-6 sm:block" />
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-3 py-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. Product names and trademarks belong to their respective manufacturers.</p>
          <p className="font-mincho tracking-[0.3em]">精密 ・ 品質 ・ 信頼</p>
        </div>
      </div>
    </footer>
  );
}
