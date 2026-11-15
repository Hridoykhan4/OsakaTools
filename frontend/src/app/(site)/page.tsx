import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileCheck2, Globe, Layers, ScanSearch } from "lucide-react";
import PrecisionDial from "@/components/PrecisionDial";
import CategoryExplorer, { type ExplorerCategory } from "@/components/CategoryExplorer";
import InquiryForm from "@/components/InquiryForm";
import { CategoryIcon } from "@/components/brand";
import { CtaBand, ProductCard, SectionHead } from "@/components/ui";
import { api, safe } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { INDUSTRIES, site } from "@/lib/site";
import type { Product } from "@/lib/types";

export const metadata = pageMetadata("/", `${site.name} — ${site.tagline}`, site.description);

const PRINCIPLES = [
  { icon: Layers, title: "Specification first", text: "Every listing carries structured technical data, so engineers can compare like for like." },
  { icon: FileCheck2, title: "Documented claims", text: "Certifications, registrations and origin statements are published only with verified evidence." },
  { icon: ScanSearch, title: "Engineered selection", text: "Instruments are matched to the measurement category, environment and standard of each task." },
  { icon: Globe, title: "Global supply", text: "One RFQ covers sourcing, documentation and delivery coordination for international buyers." },
];

const STEPS = [
  ["Specify", "Send model numbers, a bill of materials or a measurement requirement."],
  ["Source", "We confirm availability, lead time and the manufacturer for every line."],
  ["Verify", "Datasheets, certificates and market registrations are checked before quotation."],
  ["Deliver", "Consolidated supply with the documentation your project or regulator requires."],
];

export default async function Home() {
  const [{ categories }, featured, latest, { posts }, { documents }] = await Promise.all([
    safe(api.categories(), { categories: [] }),
    safe(api.products({ featured: true, limit: 8 }), { products: [] as Product[], pagination: { page: 1, limit: 8, total: 0, pages: 1 } }),
    safe(api.products({ limit: 8, sort: "newest" }), { products: [] as Product[], pagination: { page: 1, limit: 8, total: 0, pages: 1 } }),
    safe(api.articles({ limit: 3 }), { posts: [], pagination: { page: 1, limit: 3, total: 0, pages: 1 } }),
    safe(api.documents(), { documents: [] }),
  ]);

  const top = categories.filter((c) => !c.parent);
  const explorer: ExplorerCategory[] = top.map((c) => ({
    slug: c.slug, name: c.name, icon: c.icon, tagline: c.tagline, description: c.description, productCount: c.productCount || 0,
    children: categories.filter((x) => String(typeof x.parent === "object" ? x.parent?._id : x.parent) === c._id)
      .map((x) => ({ slug: x.slug, name: x.name, tagline: x.tagline, productCount: x.productCount || 0 })),
  }));
  const products = featured.products.length >= 4 ? featured.products : latest.products;
  const showcase = [...latest.products].sort((a, b) => b.specifications.length - a.specifications.length)[0];
  const totalProducts = latest.pagination.total;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="grid-paper pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_70%)]" />
        <span aria-hidden className="pointer-events-none absolute left-[-2rem] top-24 hidden select-none font-jp text-[16rem] font-bold leading-none text-ink/[0.03] xl:block">精密</span>
        <div className="shell relative grid items-center gap-10 pb-16 pt-10 lg:grid-cols-12 lg:pb-28 lg:pt-16">
          <div className="lg:col-span-6">
            <p className="eyebrow reveal">Precision instruments · <span className="font-jp tracking-[0.3em]">精密計測</span></p>
            <h1 className="display reveal mt-6 text-[3.1rem] sm:text-7xl xl:text-[6.2rem]">
              Measure<br />what matters.<br /><span className="text-beni">Exactly.</span>
            </h1>
            <p className="reveal mt-7 max-w-lg text-lg leading-relaxed text-mute">
              {site.name} supplies test and measurement instruments, laboratory equipment, industrial tools and documented medical devices to engineers, contractors and procurement teams worldwide.
            </p>
            <div className="reveal mt-9 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-primary">Explore the catalogue <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/rfq" className="btn btn-ghost">Request a quote</Link>
            </div>
            <dl className="reveal mt-12 grid max-w-lg grid-cols-3 border-t border-line pt-6">
              {[[top.length, "Product families"], [categories.length - top.length, "Specialist categories"], [totalProducts, "Listed products"]].map(([n, l]) => (
                <div key={l as string}>
                  <dt className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-faint">{l}</dt>
                  <dd className="mt-1 text-3xl font-semibold tabular-nums">{String(n).padStart(2, "0")}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative lg:col-span-6">
            <PrecisionDial className="mx-auto w-full max-w-[34rem] drop-shadow-[0_40px_60px_rgba(22,24,27,0.12)]" />
            <Link href="/resources/multimeter-measurement-categories-cat-ii-iii-iv-explained" className="absolute bottom-6 left-0 hidden rounded-2xl border border-line bg-white/85 p-4 backdrop-blur transition hover:border-ink sm:block">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">Engineering guide</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">CAT II, III and IV explained <ArrowUpRight className="h-3.5 w-3.5" /></p>
            </Link>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="border-y border-line bg-white">
        <div className="shell grid sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`reveal border-line py-8 sm:px-6 lg:py-10 ${i > 0 ? "border-t sm:border-t-0" : ""} ${i % 2 ? "sm:border-l" : ""} ${i > 1 ? "sm:border-t lg:border-t-0" : ""} ${i > 0 ? "lg:border-l" : ""}`}>
              <Icon className="h-6 w-6 text-beni" strokeWidth={1.4} />
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORY DISCOVERY */}
      <section className="shell mt-24 sm:mt-32">
        <SectionHead eyebrow="Product families" title="Every discipline. One standard of precision." intro="Navigate by the work you do. Each family is organised by measurement task, with buyer guidance written by engineers." action={{ href: "/categories", label: "All categories" }} />
        <div className="reveal mt-12"><CategoryExplorer categories={explorer} /></div>
      </section>

      {/* SELECTED INSTRUMENTS */}
      {products.length > 0 && (
        <section className="shell mt-24 sm:mt-32">
          <SectionHead eyebrow="Selected instruments" title="Available from the catalogue" action={{ href: "/products", label: "View all products" }} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((p, i) => <div key={p._id} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}><ProductCard product={p} /></div>)}
          </div>
        </section>
      )}

      {/* SPECIFICATION SHOWCASE */}
      {showcase && showcase.specifications.length > 0 && (
        <section className="mt-24 bg-ink py-20 text-paper sm:mt-32 sm:py-28">
          <div className="shell grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow !text-silver">Specification sheet</p>
              <h2 className="mt-5 text-3xl font-semibold sm:text-5xl sm:leading-[1.02]">Data you can engineer with.</h2>
              <p className="mt-5 max-w-md text-silver">Structured specifications on every product page make side-by-side comparison exact, and they are filterable across the catalogue.</p>
              <Link href={`/products/${showcase.slug}`} className="btn btn-red mt-8">Open {showcase.modelNumber || "product"} <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-beni">{showcase.manufacturer} · {showcase.modelNumber || showcase.sku}</p>
                    <p className="mt-2 truncate text-xl font-semibold">{showcase.name}</p>
                  </div>
                  <span className="hidden font-mono text-xs text-faint sm:block">REV. {new Date(showcase.updatedAt).toISOString().slice(0, 10)}</span>
                </div>
                <dl className="divide-y divide-white/10">
                  {showcase.specifications.slice(0, 7).map((s) => (
                    <div key={s.label} className="grid grid-cols-2 gap-4 py-3.5 text-sm">
                      <dt className="text-silver">{s.label}</dt>
                      <dd className="text-right font-mono">{s.value}{s.unit ? ` ${s.unit}` : ""}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* INDUSTRIES */}
      <section className="shell mt-24 sm:mt-32">
        <SectionHead eyebrow="Applications" title="Built around the way professionals work." action={{ href: "/industries", label: "Industry applications" }} />
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => (
            <Link key={ind.slug} href={`/industries#${ind.slug}`} className="reveal group flex min-h-60 flex-col justify-between bg-paper p-7 transition hover:bg-white">
              <CategoryIcon name={ind.icon} className="h-7 w-7 text-ink-2 transition group-hover:text-beni" />
              <div>
                <h3 className="text-xl font-semibold">{ind.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{ind.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* GLOBAL SOURCING */}
      <section className="shell mt-24 sm:mt-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Global sourcing desk</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-[2.6rem] sm:leading-[1.05]">Can’t find a model? We source to specification.</h2>
            <ol className="mt-10 space-y-6">
              {STEPS.map(([title, text], i) => (
                <li key={title} className="flex gap-5">
                  <span className="font-mono text-sm text-beni">{String(i + 1).padStart(2, "0")}</span>
                  <div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-mute">{text}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-6 sm:p-10 lg:col-span-7">
            <p className="text-lg font-semibold">Tell us what you need</p>
            <p className="mt-1 text-sm text-mute">Model numbers, quantities and destination country help us respond faster.</p>
            <div className="mt-6"><InquiryForm type="sourcing" compact submitLabel="Send sourcing request" /></div>
          </div>
        </div>
      </section>

      {/* QUALITY */}
      <section className="shell mt-24 sm:mt-32">
        <div className="grid gap-10 rounded-[2rem] border border-line bg-white p-8 sm:p-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">Quality & documentation</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Every claim is backed by a document you can inspect.</h2>
            <p className="mt-4 max-w-xl text-mute">
              Certificates, test reports, market registrations and company documents are reviewed before they appear on this site. Medical devices are offered only where their registration is documented.
            </p>
          </div>
          <div className="flex flex-col justify-between gap-6 lg:col-span-5 lg:items-end">
            <p className="font-mono text-6xl font-medium tabular-nums">{String(documents.length).padStart(2, "0")}</p>
            <p className="text-sm text-mute lg:text-right">verified documents published</p>
            <Link href="/quality" className="btn btn-ghost">Open the documentation library <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      {posts.length > 0 && (
        <section className="shell mt-24 sm:mt-32">
          <SectionHead eyebrow="Engineering resources" title="Guidance from the measurement bench" action={{ href: "/resources", label: "All articles" }} />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {posts.map((post) => (
              <Link key={post._id} href={`/resources/${post.slug}`} className="reveal group card flex flex-col justify-between p-7 transition hover:border-ink">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-beni">{post.category}</p>
                  <h3 className="mt-4 text-xl font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm text-mute">{post.excerpt}</p>
                </div>
                <p className="mt-8 flex items-center justify-between font-mono text-xs text-faint">{post.readingMinutes} min read <ArrowUpRight className="h-4 w-4 transition group-hover:text-beni" /></p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
