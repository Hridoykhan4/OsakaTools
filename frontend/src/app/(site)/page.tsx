import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import HeroSun from "@/components/motion/HeroSun";
import Emaki, { type EmakiFamily } from "@/components/motion/Emaki";
import WordReveal from "@/components/motion/WordReveal";
import Magnetic from "@/components/motion/Magnetic";
import InquiryForm from "@/components/InquiryForm";
import { CategoryIcon, Hanko, familyKanji } from "@/components/brand";
import { CtaBand, ProductCard, SectionHead } from "@/components/ui";
import { api, loadSettings, safe } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { INDUSTRIES, site } from "@/lib/site";
import type { Category, Pagination, Product } from "@/lib/types";

export const metadata = pageMetadata("/", `${site.name} — ${site.tagline}`, site.description);

const EMPTY = { products: [] as Product[], pagination: { page: 1, limit: 8, total: 0, pages: 1 } as Pagination };

// A real sequence, so it is numbered — in kanji numerals.
const STEPS = [
  ["一", "Specify", "Send model numbers, a bill of materials or a measurement requirement."],
  ["二", "Source", "We confirm availability, lead time and the manufacturer for every line."],
  ["三", "Verify", "Datasheets, certificates and market registrations are checked before quotation."],
  ["四", "Deliver", "Consolidated supply with the documentation your project or regulator requires."],
] as const;

const DEFAULTS = {
  kicker: "OSAKA TOOL — 精密計測",
  title: "Precision, practised as a discipline.",
  subtitle: `${site.name} supplies test and measurement instruments, laboratory equipment, industrial tools, fire protection systems and documented medical devices to engineers and procurement teams worldwide.`,
  kanji: "大阪精密",
  statement: "Every listing names its manufacturer, its model and its data. Every certificate we show is one you can open. Precision is not a slogan here; it is a specification.",
};

export default async function Home() {
  const [{ categories }, featured, latest, { posts }, { documents }, settings] = await Promise.all([
    safe(api.categories(), { categories: [] as Category[] }),
    safe(api.products({ featured: true, limit: 8 }), EMPTY),
    safe(api.products({ limit: 12, sort: "newest" }), EMPTY),
    safe(api.articles({ limit: 3 }), { posts: [], pagination: EMPTY.pagination }),
    safe(api.documents(), { documents: [] }),
    loadSettings(),
  ]);

  const parentId = (c: Category) => String((typeof c.parent === "object" ? c.parent?._id : c.parent) || "");
  const top = categories.filter((c) => !c.parent);
  const chosen = settings.home.featuredCategories.map((s) => categories.find((c) => c.slug === s)).filter(Boolean) as Category[];
  // Without an admin choice, lead with the families that have the most to show.
  const familyList = chosen.length ? chosen : [...top].sort((a, b) => (b.productCount || 0) - (a.productCount || 0) || a.order - b.order);
  const samples = await Promise.all(familyList.map((f) => safe(api.products({ category: f.slug, limit: 3 }), EMPTY)));
  const families: EmakiFamily[] = familyList.map((f, i) => ({
    slug: f.slug, name: f.name, kanji: familyKanji(f.slug), tagline: f.tagline, count: f.productCount || 0,
    children: categories.filter((x) => parentId(x) === f._id).map((x) => ({ slug: x.slug, name: x.name })),
    images: samples[i].products.filter((p) => p.images[0]).map((p) => ({ url: p.images[0].url, alt: p.name })),
  }));

  const products = featured.products.length >= 4 ? featured.products : latest.products;
  const hero = {
    kicker: settings.hero.kicker || DEFAULTS.kicker, title: settings.hero.title || DEFAULTS.title,
    subtitle: settings.hero.subtitle || DEFAULTS.subtitle, kanji: settings.hero.kanji || DEFAULTS.kanji,
    stats: [
      { value: latest.pagination.total, label: "Products listed" },
      { value: top.length, label: "Product families" },
      { value: categories.length - top.length, label: "Categories" },
    ],
  };
  const ribbon = top.map((c) => ({ name: c.name, kanji: familyKanji(c.slug) }));

  return (
    <>
      <HeroSun {...hero} />

      {/* Ribbon of families, like a noren curtain line */}
      <div aria-hidden className="overflow-hidden border-y border-line bg-white py-4">
        <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
          {[...ribbon, ...ribbon].map((r, i) => (
            <span key={i} className="flex items-center gap-4 font-mincho text-xl">
              <span className="text-beni">{r.kanji}</span>{r.name}
              <span className="ml-6 h-1.5 w-1.5 rounded-full bg-ink/30" />
            </span>
          ))}
        </div>
      </div>

      <Emaki families={families} />

      {/* Statement */}
      <section className="shell grid gap-10 py-28 sm:py-40 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <p className="eyebrow">Our standard</p>
          <p aria-hidden className="vertical mt-8 hidden font-mincho text-5xl font-extrabold text-beni lg:block">誠実</p>
        </div>
        <WordReveal text={settings.home.statement || DEFAULTS.statement}
          className="font-mincho text-3xl font-semibold leading-[1.3] sm:text-5xl sm:leading-[1.25] lg:col-span-9" />
      </section>

      {/* Products */}
      {products.length > 0 && (
        <section className="shell">
          <SectionHead eyebrow="From the catalogue" kanji="品" title="Selected products, with the data to back them."
            action={{ href: "/products", label: `All ${latest.pagination.total} products` }} />
          <div className="mt-14 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((p, i) => <div key={p._id} className="reveal" style={{ transitionDelay: `${(i % 4) * 90}ms` }}><ProductCard product={p} /></div>)}
          </div>
        </section>
      )}

      {/* Sourcing desk */}
      <section className="mt-32 border-y border-line bg-white py-24 sm:mt-40 sm:py-32">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Global sourcing desk</p>
            <h2 className="mt-4 text-3xl sm:text-[2.9rem] sm:leading-[1.08]">Can’t find a model? We source to specification.</h2>
            <ol className="mt-12 border-t border-line">
              {STEPS.map(([n, title, text]) => (
                <li key={title} className="reveal grid grid-cols-[3.5rem_1fr] gap-4 border-b border-line py-6">
                  <span className="font-mincho text-4xl font-extrabold leading-none text-beni">{n}</span>
                  <div><p className="font-mincho text-xl font-semibold">{title}</p><p className="mt-1 text-sm text-mute">{text}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative lg:col-span-7">
            <div className="rounded-sm border border-line bg-paper p-6 sm:p-10">
              <p className="font-mincho text-2xl font-semibold">Tell us what you need</p>
              <p className="mt-1 text-sm text-mute">Model numbers, quantities and destination country help us respond faster.</p>
              <div className="mt-6"><InquiryForm type="sourcing" compact submitLabel="Send sourcing request" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="shell mt-32 sm:mt-40">
        <SectionHead eyebrow="Applications" kanji="業" title="Built around the way professionals work." action={{ href: "/industries", label: "Industry applications" }} />
        <ul className="mt-14 border-t border-ink">
          {INDUSTRIES.map((ind) => (
            <li key={ind.slug} className="reveal">
              <Link href={`/industries#${ind.slug}`} className="group grid items-center gap-4 border-b border-line py-7 transition-colors hover:bg-white sm:grid-cols-12 sm:px-4">
                <CategoryIcon name={ind.icon} className="h-7 w-7 text-ink-2 transition group-hover:text-beni sm:col-span-1" />
                <h3 className="text-2xl transition group-hover:translate-x-2 sm:col-span-4 sm:text-3xl">{ind.name}</h3>
                <p className="text-sm text-mute sm:col-span-6">{ind.text}</p>
                <ArrowUpRight className="hidden h-6 w-6 justify-self-end text-faint transition group-hover:text-beni sm:col-span-1 sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Quality */}
      <section className="shell mt-32 sm:mt-40">
        <div className="asanoha grid gap-10 rounded-sm border border-line bg-white p-8 sm:p-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">Quality & documentation</p>
            <h2 className="mt-4 text-3xl sm:text-5xl sm:leading-[1.08]">Every claim is backed by a document you can inspect.</h2>
            <p className="mt-5 max-w-xl text-mute">
              Certificates, test reports, market registrations and company documents are reviewed before they appear on this site. Medical devices are offered only where their registration is documented.
            </p>
            <Magnetic><Link href="/quality" className="btn btn-ghost mt-8">Open the documentation library <ArrowRight className="h-4 w-4" /></Link></Magnetic>
          </div>
          <div className="flex flex-col items-start justify-between gap-6 lg:col-span-5 lg:items-end">
            <Hanko className="h-24 w-24 rotate-[-8deg]" label={["品", "質", "保", "証"]} />
            <div className="lg:text-right">
              <p className="font-mincho text-7xl font-semibold tabular-nums">{String(documents.length).padStart(2, "0")}</p>
              <p className="text-sm text-mute">verified documents published</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      {posts.length > 0 && (
        <section className="shell mt-32 sm:mt-40">
          <SectionHead eyebrow="Engineering resources" kanji="技" title="Guidance from the measurement bench" action={{ href: "/resources", label: "All articles" }} />
          <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
            {posts.map((post) => (
              <Link key={post._id} href={`/resources/${post.slug}`} className="group flex flex-col justify-between bg-paper p-8 transition hover:bg-white">
                <div>
                  <p className="text-xs text-beni">{post.category}</p>
                  <h3 className="mt-4 text-2xl leading-snug">{post.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm text-mute">{post.excerpt}</p>
                </div>
                <p className="mt-10 flex items-center justify-between text-xs text-faint">{post.readingMinutes} min read <ArrowUpRight className="h-4 w-4 transition group-hover:text-beni" /></p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
