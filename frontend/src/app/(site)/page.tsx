import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import HeroSun from "@/components/motion/HeroSun";
import FamilyBento, { type Family } from "@/components/FamilyBento";
import ProductRail from "@/components/ProductRail";
import { familyKanji } from "@/components/brand";
import { CtaBand, ProductCard } from "@/components/ui";
import { api, loadSettings, safe } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import type { Category, Pagination, Product } from "@/lib/types";

export const metadata = pageMetadata("/", `${site.name} — ${site.tagline}`, site.description);

const EMPTY = { products: [] as Product[], pagination: { page: 1, limit: 8, total: 0, pages: 1 } as Pagination };

const DEFAULTS = {
  kicker: "OSAKA TOOL — 精密計測",
  title: "Precision, practised as a discipline.",
  subtitle: "Test instruments, tools, fire protection and medical devices, supplied worldwide.",
  kanji: "大阪精密",
};

export default async function Home() {
  const [{ categories }, latest, settings] = await Promise.all([
    safe(api.categories(), { categories: [] as Category[] }),
    safe(api.products({ limit: 12, sort: "newest" }), EMPTY),
    loadSettings(),
  ]);

  const parentId = (c: Category) => String((typeof c.parent === "object" ? c.parent?._id : c.parent) || "");
  const top = categories.filter((c) => !c.parent);
  const chosen = settings.home.featuredCategories.map((s) => categories.find((c) => c.slug === s)).filter(Boolean) as Category[];
  // Without an admin choice, lead with the families that have the most to show.
  const familyList = chosen.length ? chosen : [...top].sort((a, b) => (b.productCount || 0) - (a.productCount || 0) || a.order - b.order);

  // Rails: every subcategory with at least three products, busiest first.
  const railCats = categories.filter((c) => c.parent && (c.productCount || 0) >= 3)
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0)).slice(0, 8);
  const [samples, rails] = await Promise.all([
    Promise.all(familyList.map((f) => safe(api.products({ category: f.slug, limit: 3 }), EMPTY))),
    Promise.all(railCats.map((c) => safe(api.products({ category: c.slug, limit: 12 }), EMPTY))),
  ]);

  const families: Family[] = familyList.map((f, i) => ({
    slug: f.slug, name: f.name, kanji: familyKanji(f.slug), tagline: f.tagline, count: f.productCount || 0,
    children: categories.filter((x) => parentId(x) === f._id).map((x) => ({ slug: x.slug, name: x.name })),
    images: samples[i].products.filter((p) => p.images[0]).map((p) => ({ url: p.images[0].url, alt: p.name })),
  }));
  const tiles = categories.filter((c) => c.image?.url).sort((a, b) => (b.productCount || 0) - (a.productCount || 0)).slice(0, 8);

  const hero = {
    kicker: settings.hero.kicker || DEFAULTS.kicker, title: settings.hero.title || DEFAULTS.title,
    subtitle: settings.hero.subtitle || DEFAULTS.subtitle, kanji: settings.hero.kanji || DEFAULTS.kanji,
    stats: [
      { value: latest.pagination.total, label: "Products" },
      { value: top.length, label: "Families" },
      { value: categories.length - top.length, label: "Categories" },
    ],
  };
  const ribbon = top.map((c) => ({ name: c.name, kanji: familyKanji(c.slug) }));

  return (
    <>
      <HeroSun {...hero} />

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

      {/* New arrivals */}
      {latest.products.length > 0 && (
        <section className="shell pt-20 sm:pt-28">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-3xl sm:text-5xl">New in the catalogue</h2>
            <Link href="/products" className="group inline-flex shrink-0 items-center gap-2 border-b border-ink pb-1 text-sm font-medium hover:border-beni hover:text-beni">
              All {latest.pagination.total} products <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {latest.products.map((p, i) => <div key={p._id} className="reveal"><ProductCard product={p} priority={i < 4} /></div>)}
          </div>
        </section>
      )}

      <FamilyBento families={families} />

      {/* Shop by category */}
      {tiles.length > 0 && (
        <section className="shell">
          <h2 className="text-3xl sm:text-5xl">Shop by category</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {tiles.map((c) => (
              <Link key={c._id} href={`/categories/${c.slug}`} className="reveal group relative aspect-[4/5] overflow-hidden rounded-md border border-line bg-white">
                <Image src={c.image!.url} alt="" fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-4 pt-12">
                  <span className="block font-mincho text-lg font-semibold leading-tight">{c.name}</span>
                  <span className="mt-1 block text-xs text-beni">{c.productCount} products</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Product rails by category */}
      <div className="mt-24 space-y-20 sm:mt-32 sm:space-y-24">
        {railCats.map((c, i) => rails[i].products.length > 0 && (
          <section key={c._id} className="shell">
            <div className="flex items-baseline gap-4 pr-28">
              <h2 className="text-2xl sm:text-4xl">{c.name}</h2>
              <Link href={`/categories/${c.slug}`} className="shrink-0 text-sm text-beni hover:underline">View all {c.productCount}</Link>
            </div>
            <div className="mt-8">
              <ProductRail label={c.name}>
                {rails[i].products.map((p) => (
                  <div key={p._id} role="listitem" className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc((100%-4rem)/5)]"><ProductCard product={p} /></div>
                ))}
              </ProductRail>
            </div>
          </section>
        ))}
      </div>

      <CtaBand title="Need a model that isn’t listed?" text="Send a model number or a bill of materials. We reply with availability, lead time and documents." />
    </>
  );
}
