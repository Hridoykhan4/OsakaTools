import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import HeroInstrument from "@/components/home/HeroInstrument";
import HomeMotion from "@/components/home/HomeMotion";
import Gauge from "@/components/home/Gauge";
import { ProductBuyBox } from "@/components/ProductActions";
import { loadSettings } from "@/lib/api";
import { loadHome } from "@/lib/home";
import { cld, trimmed } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import type { Category, Product } from "@/lib/types";

export const metadata = pageMetadata("/", `${site.name} — ${site.tagline}`, site.description);

// Macro crop of the bit tray from the source photograph (no packaging text).
const ES480_DETAIL = "c_crop,x_150,y_445,w_520,h_235";
const DEFAULT_TITLE = "Precision has a form.";
const DEFAULT_SUB = "Instruments, tools and engineered systems for professionals, specified, documented and supplied worldwide.";

const STEPS = [
  ["Specify", "Model numbers, a bill of materials or a measurement requirement."],
  ["Source", "Availability, lead time and the manufacturer, confirmed line by line."],
  ["Verify", "Datasheets, certificates and registrations checked before quotation."],
  ["Deliver", "Consolidated supply with the documents your project requires."],
] as const;

const PRINCIPLES = [
  { jp: "精度", romaji: "seido", en: "Accuracy", text: "Specifications come from manufacturer data. Nothing is estimated, rounded up or invented." },
  { jp: "記録", romaji: "kiroku", en: "Record", text: "Every change to the catalogue is logged, attributed and reviewable." },
  { jp: "誠実", romaji: "seijitsu", en: "Integrity", text: "Certificates, origin and medical registrations appear only when the document exists." },
] as const;

const spec = (p: Product | null, label: string) => p?.specifications.find((s) => s.label.toLowerCase() === label.toLowerCase());
const childrenOf = (cats: Category[], slug: string) => {
  const parent = cats.find((c) => c.slug === slug);
  return parent ? cats.filter((c) => (typeof c.parent === "object" ? c.parent?._id : c.parent) === parent._id) : [];
};

export default async function Home() {
  const [home, settings] = await Promise.all([loadHome(), loadSettings()]);
  const { hero, detail, detailImage, selected, protect, categories, total } = home;
  const fire = categories.find((c) => c.slug === "fire-protection-building-services");
  const pressure = spec(detail, "Maximum pressure"), power = spec(detail, "Rated power");
  const otherSpecs = detail?.specifications.filter((s) => s !== pressure && s !== power) || [];

  return (
    <>
      <HeroInstrument parts={hero} title={settings.hero.title || DEFAULT_TITLE} subtitle={settings.hero.subtitle || DEFAULT_SUB} />

      <HomeMotion>
        {/* 2 — Engineering detail: one instrument, read value by value */}
        {detail && (
          <section className="border-y border-line bg-white" aria-labelledby="detail-title">
            <div className="shell grid grid-cols-1 gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:gap-16">
              <div className="relative min-w-0 lg:col-span-6">
                <div data-wipe className="relative mx-auto aspect-[3/5] w-full max-w-[20rem] overflow-hidden bg-white">
                  <Image src={detailImage} alt={detail.name} fill sizes="(min-width:1024px) 26vw, 80vw" className="object-contain p-[6%]" />
                </div>
                <p className="readout mx-auto mt-4 max-w-md text-faint">{detail.manufacturer} {detail.modelNumber} · product photograph</p>
              </div>
              <div className="flex min-w-0 flex-col justify-center lg:col-span-6">
                <p data-reveal className="eyebrow">Engineering detail</p>
                <h2 id="detail-title" data-reveal className="mt-5 text-4xl leading-[1.02] sm:text-6xl">Read it value by value.</h2>
                <p data-reveal className="mt-5 max-w-md text-lg text-mute">{detail.manufacturer} {detail.modelNumber}, a portable air compressor, specified the way every listing should be.</p>
                <dl data-reveal className="mt-12 grid grid-cols-2 border-t border-ink">
                  {[pressure, power].filter(Boolean).map((s) => (
                    <div key={s!.label} className="border-b border-line py-6 pr-4">
                      <dd className="text-5xl font-medium tracking-[-0.05em] tabular-nums sm:text-7xl"><span data-count={s!.value}>{s!.value}</span><span className="ml-2 text-2xl text-faint">{s!.unit}</span></dd>
                      <dt className="mt-2 text-sm text-mute">{s!.label}</dt>
                    </div>
                  ))}
                </dl>
                <dl data-reveal className="mt-2">
                  {otherSpecs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-6 border-b border-line py-3 text-sm">
                      <dt className="text-mute">{s.label}</dt><dd className="readout text-[0.8rem] text-ink">{s.value}{s.unit ? ` ${s.unit}` : ""}</dd>
                    </div>
                  ))}
                </dl>
                <div data-reveal className="mt-10 max-w-md">
                  <ProductBuyBox product={{ id: detail._id, slug: detail.slug, name: detail.name, sku: detail.sku || detail.modelNumber, image: detail.images[0]?.url }} moq={detail.moq} />
                  <Link href={`/products/${detail.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium hover:text-beni">Open the full specification <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3 — Disciplines */}
        <section className="py-24 sm:py-36" aria-labelledby="disciplines-title">
          <div className="shell">
            <h2 id="disciplines-title" data-reveal className="max-w-3xl text-4xl leading-[1.02] sm:text-6xl">Three disciplines. <span className="text-silver">One standard of evidence.</span></h2>
          </div>

          {/* Measure */}
          <article className="shell mt-20 grid grid-cols-1 gap-10 border-t border-line pt-10 sm:mt-28 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p data-reveal className="readout text-faint">01 / 03</p>
              <h3 data-reveal className="mt-6 text-[clamp(3.5rem,9vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.06em]">Measure</h3>
              <p data-reveal className="mt-4 text-sm text-mute"><span lang="ja" className="font-jp">計測</span> · keisoku · measurement</p>
              <p data-reveal className="mt-8 max-w-md text-lg text-ink-2">Electrical test, electronics and dimensional instruments: multimeters, clamp meters, insulation testers, oscilloscopes and gauges, sourced to specification.</p>
              <ul data-reveal className="mt-8 flex flex-wrap gap-2">
                {[...childrenOf(categories, "electrical-test-measurement"), ...childrenOf(categories, "electronics-laboratory"), ...childrenOf(categories, "industrial-measurement")].map((c) => (
                  <li key={c._id}><Link href={`/categories/${c.slug}`} className="inline-block rounded-full border border-line bg-white px-3.5 py-1.5 text-sm transition hover:border-ink">{c.name}</Link></li>
                ))}
              </ul>
            </div>
            <div className="relative lg:col-span-6 lg:col-start-7">
              <div className="relative mx-auto aspect-square w-full max-w-xl bg-white">
                <Gauge className="absolute inset-[6%]" />
              </div>
            </div>
          </article>

          {/* Protect */}
          <article className="shell mt-24 grid grid-cols-1 gap-10 border-t border-line pt-10 sm:mt-32 lg:grid-cols-12">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4" style={{ aspectRatio: "1 / 0.9" }}>
                {protect.slice(0, 3).map((p, i) => (
                  <Link key={p._id} href={`/products/${p.slug}`} data-parallax={[0.15, 0.35, 0.55][i]}
                    className={`group relative overflow-hidden bg-white ${["col-span-4 row-span-6", "col-span-2 row-span-3", "col-span-2 row-span-3"][i]}`}>
                    <div data-wipe className="absolute inset-0">
                      <Image src={trimmed(p.images[0]?.url)} alt={p.name} fill sizes="(min-width:1024px) 30vw, 60vw" className="object-contain p-[12%] transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <span className="absolute bottom-3 left-3 right-3 text-xs text-mute opacity-0 transition-opacity group-hover:opacity-100">{p.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-4 lg:col-start-9">
              <p data-reveal className="readout text-faint">02 / 03</p>
              <h3 data-reveal className="mt-6 text-[clamp(3.5rem,9vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.06em]">Protect</h3>
              <p data-reveal className="mt-4 text-sm text-mute"><span lang="ja" className="font-jp">防護</span> · bōgo · protection</p>
              <p data-reveal className="mt-8 text-lg text-ink-2">Fire protection and building services: valves, sprinklers, pumps, hydrants, foam systems, alarm and emergency lighting, specified to NFPA, EN or BS design standards.</p>
              {fire && <p data-reveal className="mt-8 flex items-baseline gap-3"><span className="text-6xl font-medium tracking-[-0.05em]" data-count={fire.productCount || 0}>{fire.productCount || 0}</span><span className="text-sm text-mute">products in the catalogue</span></p>}
              <Link data-reveal href="/categories/fire-protection-building-services" className="btn btn-ghost mt-8">Explore fire protection <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </article>

          {/* Equip */}
          <article className="shell mt-24 grid grid-cols-1 gap-10 border-t border-line pt-10 sm:mt-32 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p data-reveal className="readout text-faint">03 / 03</p>
              <h3 data-reveal className="mt-6 text-[clamp(3.5rem,9vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.06em]">Equip</h3>
              <p data-reveal className="mt-4 text-sm text-mute"><span lang="ja" className="font-jp">工具</span> · kōgu · tools</p>
              <p data-reveal className="mt-8 max-w-md text-lg text-ink-2">Industrial and workshop tools: precision screwdriver systems, portable compressors and inflators, and the accessories that keep field teams moving.</p>
              <ul data-reveal className="mt-8 flex flex-wrap gap-2">
                {childrenOf(categories, "industrial-tools").concat(categories.filter((c) => c.slug === "soldering-repair")).map((c) => (
                  <li key={c._id}><Link href={`/categories/${c.slug}`} className="inline-block rounded-full border border-line bg-white px-3.5 py-1.5 text-sm transition hover:border-ink">{c.name}</Link></li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              {selected.find((p) => p.slug.startsWith("mechanic-es480")) && (() => {
                const p = selected.find((x) => x.slug.startsWith("mechanic-es480"))!;
                return (
                  <Link href={`/products/${p.slug}`} className="group block">
                    <div data-wipe className="relative aspect-[520/235] overflow-hidden rounded-md bg-paper-2">
                      <Image src={cld(p.images[0].url, ES480_DETAIL)} alt={`${p.name}, detail of the driver and bit tray`} fill sizes="(min-width:1024px) 45vw, 90vw" className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]" />
                    </div>
                    <p className="mt-4 flex items-center justify-between gap-4 text-sm"><span><span className="text-ink">{p.manufacturer} {p.modelNumber}</span> <span className="text-mute">· 48-in-1 precision electric screwdriver set</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-faint group-hover:text-beni" /></p>
                  </Link>
                );
              })()}
            </div>
          </article>
        </section>

        {/* 4 — Selected instruments (four, no more) */}
        <section className="border-y border-line bg-white py-24 sm:py-32" aria-labelledby="selected-title">
          <div className="shell">
            <div className="flex items-end justify-between gap-6">
              <h2 id="selected-title" data-reveal className="text-4xl leading-[1.02] sm:text-6xl">Selected instruments</h2>
              <Link data-reveal href="/products" className="hidden shrink-0 items-center gap-2 border-b border-ink pb-1 text-sm font-medium hover:border-beni hover:text-beni sm:inline-flex">All {total} products <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-14 grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {selected.filter((p) => !p.slug.startsWith("mechanic-es480")).concat(protect.slice(3)).slice(0, 4).map((p) => {
                const cat = typeof p.category === "object" ? p.category : null;
                return (
                  <Link key={p._id} href={`/products/${p.slug}`} className="group block">
                    <div data-wipe className="relative aspect-[4/5] overflow-hidden bg-paper">
                      <Image src={trimmed(p.images[0]?.url)} alt={p.name} fill sizes="(min-width:1024px) 24vw, (min-width:640px) 48vw, 92vw" className="object-contain p-[14%] drop-shadow-[0_20px_22px_rgba(21,23,26,0.12)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
                      <span className="absolute left-4 top-4 h-2 w-2 bg-beni opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-5 text-xs text-faint">{cat?.name}</p>
                    <h3 className="mt-1 text-lg font-medium leading-snug tracking-[-0.02em] group-hover:text-beni">{p.name}</h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5 — Identity */}
        <section className="shell py-24 sm:py-36" aria-labelledby="identity-title">
          <p data-reveal className="eyebrow">How we work</p>
          <h2 id="identity-title" data-reveal className="mt-6 max-w-5xl text-4xl leading-[1.08] sm:text-6xl">
            We publish what can be verified. <span className="text-silver">Model, data and documents first; claims only when the evidence exists.</span>
          </h2>
          <div className="mt-20 grid gap-px overflow-hidden border-y border-line bg-line sm:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.en} data-reveal className="bg-paper py-10 sm:px-8">
                <p lang="ja" className="font-jp text-4xl text-ink">{p.jp}</p>
                <p className="mt-3 text-sm text-faint">{p.romaji} · {p.en.toLowerCase()}</p>
                <p className="mt-6 text-lg font-medium">{p.en}</p>
                <p className="mt-2 text-mute">{p.text}</p>
              </div>
            ))}
          </div>
          <dl className="mt-16 grid grid-cols-3 gap-6">
            {[[total, "Products published"], [categories.filter((c) => !c.parent).length, "Product families"], [categories.filter((c) => c.parent).length, "Categories"]].map(([n, l]) => (
              <div key={String(l)} data-reveal>
                <dd className="text-5xl font-medium tracking-[-0.05em] tabular-nums sm:text-7xl"><span data-count={n}>{n}</span></dd>
                <dt className="mt-2 text-sm text-mute">{l}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* 6 — Global business */}
        <section className="border-t border-line bg-white" aria-labelledby="rfq-title">
          <div className="shell grid grid-cols-1 gap-14 py-24 sm:py-32 lg:grid-cols-12">
            <h2 id="rfq-title" data-reveal className="text-[clamp(2.8rem,7vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.055em] lg:col-span-7">
              Send a specification.<br /><span className="text-silver">Receive a quotation.</span>
            </h2>
            <div className="lg:col-span-4 lg:col-start-9">
              <ol className="border-t border-ink">
                {STEPS.map(([title, text], i) => (
                  <li key={title} data-reveal className="grid grid-cols-[2.5rem_1fr] gap-2 border-b border-line py-4">
                    <span className="readout pt-1 text-beni">{String(i + 1).padStart(2, "0")}</span>
                    <div><p className="font-medium">{title}</p><p className="mt-0.5 text-sm text-mute">{text}</p></div>
                  </li>
                ))}
              </ol>
              <div data-reveal className="mt-8 flex flex-wrap gap-3">
                <Link href="/rfq" className="btn btn-primary">Start a quote request <ArrowRight className="h-4 w-4" /></Link>
                <a href={`mailto:${settings.contact.email || site.email}`} className="btn btn-ghost">{settings.contact.email || site.email}</a>
              </div>
            </div>
          </div>
        </section>
      </HomeMotion>
    </>
  );
}
