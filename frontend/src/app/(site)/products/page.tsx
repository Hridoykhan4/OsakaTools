import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { Empty, PageHero, ProductCard } from "@/components/ui";
import { api, safe } from "@/lib/api";
import { collectionSchema, pageMetadata, pageNumber } from "@/lib/seo";
import type { Category, Facets, Product } from "@/lib/types";

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Boolean(one(sp.q) || one(sp.category) || one(sp.manufacturer) || many(sp.spec).length || one(sp.sort));
  const page = pageNumber(sp.page);
  const meta = pageMetadata(page > 1 ? `/products?page=${page}` : "/products", page > 1 ? `Product catalogue — page ${page}` : "Product catalogue",
    "Search the OSAKA TOOL catalogue of test and measurement instruments, laboratory equipment, industrial tools and medical devices by model, SKU, manufacturer and specification.",
    { noindex: filtered });
  return meta;
}

function href(sp: Search, patch: Record<string, string | string[] | null>) {
  const s = new URLSearchParams();
  const merged: Record<string, string | string[] | undefined | null> = { ...sp, page: undefined, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v === null || v === undefined || v === "") continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => s.append(k, x));
  }
  const q = s.toString();
  return `/products${q ? `?${q}` : ""}`;
}

export default async function Products({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = pageNumber(sp.page);
  const q = one(sp.q).slice(0, 120);
  const category = one(sp.category);
  const manufacturer = one(sp.manufacturer);
  const specs = many(sp.spec).slice(0, 8);
  const sort = one(sp.sort);

  const [{ categories }, data] = await Promise.all([
    safe(api.categories(), { categories: [] as Category[] }),
    safe(api.products({ page, limit: 24, q, category, manufacturer, spec: specs, sort, facets: true }),
      { products: [] as Product[], pagination: { page: 1, limit: 24, total: 0, pages: 1 }, facets: { manufacturers: [], brands: [], specs: [] } as Facets }),
  ]);
  const { products, pagination, facets } = data;
  const top = categories.filter((c) => !c.parent);
  const childrenOf = (id: string) => categories.filter((c) => String(typeof c.parent === "object" ? c.parent?._id : c.parent) === id);
  const activeCategory = categories.find((c) => c.slug === category);
  const activeFilters = [
    ...(q ? [{ label: `“${q}”`, to: href(sp, { q: null }) }] : []),
    ...(activeCategory ? [{ label: activeCategory.name, to: href(sp, { category: null }) }] : []),
    ...(manufacturer ? [{ label: manufacturer, to: href(sp, { manufacturer: null }) }] : []),
    ...specs.map((s) => ({ label: s.replace("::", ": "), to: href(sp, { spec: specs.filter((x) => x !== s) }) })),
  ];

  const FILTERS = (
    <div className="space-y-8">
        <div>
          <p className="eyebrow">Category</p>
          <ul className="mt-4 space-y-1 text-sm">
            <li><Link href={href(sp, { category: null })} className={`block rounded-lg px-2 py-1.5 ${!category ? "bg-beni text-white" : "hover:bg-paper-2"}`}>All categories</Link></li>
            {top.map((c) => (
              <li key={c._id}>
                <Link href={href(sp, { category: c.slug })} className={`flex justify-between rounded-lg px-2 py-1.5 ${category === c.slug ? "bg-beni text-white" : "hover:bg-paper-2"}`}>
                  <span>{c.name}</span><span className="font-mono text-xs opacity-60">{c.productCount || 0}</span>
                </Link>
                <ul className="ml-3 border-l border-line pl-2">
                  {childrenOf(c._id).filter((x) => x.productCount || category === x.slug).map((x) => (
                    <li key={x._id}>
                      <Link href={href(sp, { category: x.slug })} className={`flex justify-between rounded-lg px-2 py-1 text-[0.82rem] ${category === x.slug ? "bg-beni text-white" : "text-mute hover:bg-paper-2"}`}>
                        <span>{x.name}</span><span className="font-mono text-xs opacity-60">{x.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        {facets && facets.manufacturers.length > 0 && (
          <div>
            <p className="eyebrow">Manufacturer</p>
            <ul className="mt-4 space-y-1 text-sm">
              {facets.manufacturers.map((m) => (
                <li key={m.name}>
                  <Link href={href(sp, { manufacturer: manufacturer === m.name ? null : m.name })} aria-current={manufacturer === m.name || undefined}
                    className={`flex justify-between rounded-lg px-2 py-1.5 ${manufacturer === m.name ? "bg-beni text-white" : "hover:bg-paper-2"}`}>
                    <span>{m.name}</span><span className="font-mono text-xs opacity-60">{m.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {facets?.specs.map((group) => (
          <div key={group.label}>
            <p className="eyebrow">{group.label}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {group.values.map((v) => {
                const key = `${group.label}::${v.value}`;
                const on = specs.includes(key);
                return (
                  <Link key={key} href={href(sp, { spec: on ? specs.filter((s) => s !== key) : [...specs, key] })} aria-current={on || undefined}
                    className={`rounded-full border px-3 py-1 font-mono text-xs ${on ? "border-ink bg-beni text-white" : "border-line hover:border-ink"}`}>
                    {v.value} <span className="opacity-50">({v.count})</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

    </div>
  );

  return (
    <>
      <PageHero eyebrow="Catalogue" title="Product catalogue" crumbs={[{ name: "Products", path: "/products" }]}
        intro="Search by product name, model number, SKU or manufacturer. Filter by category and technical specification.">
        <form action="/products" className="mt-10 flex max-w-2xl items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-5 focus-within:border-ai">
          <Search className="h-5 w-5 shrink-0 text-faint" />
          {category && <input type="hidden" name="category" value={category} />}
          <input name="q" defaultValue={q} placeholder="e.g. ES480, tyre inflator, multimeter" aria-label="Search products" className="h-11 min-w-0 flex-1 bg-transparent outline-none" />
          <button className="btn btn-primary !min-h-11">Search</button>
        </form>
      </PageHero>

      <JsonLd data={collectionSchema("/products", "OSAKA TOOL product catalogue", products.map((p) => ({ name: p.name, path: `/products/${p.slug}` })))} />

      <div className="shell mt-10 grid gap-10 lg:grid-cols-12">
        <aside className="lg:col-span-3" aria-label="Filters">
          <details className="lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-full border border-line px-4 py-2.5 text-sm font-medium">
              <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Filters</span>
              <span className="font-mono text-xs text-faint">{activeFilters.length}</span>
            </summary>
            <div className="mt-6">{FILTERS}</div>
          </details>
          <div className="hidden lg:sticky lg:top-24 lg:block">{FILTERS}</div>
        </aside>

        <section className="lg:col-span-9" aria-live="polite">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-mute"><span className="font-mono text-ink">{pagination.total}</span> {pagination.total === 1 ? "product" : "products"}</p>
            <div className="flex items-center gap-1 text-sm">
              {[["", "Recommended"], ["newest", "Newest"], ["name", "A–Z"]].map(([value, label]) => (
                <Link key={value} href={href(sp, { sort: value || null })} className={`rounded-full px-3 py-1.5 ${sort === value ? "bg-beni text-white" : "hover:bg-paper-2"}`}>{label}</Link>
              ))}
            </div>
          </div>
          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilters.map((f) => (
                <Link key={f.label} href={f.to} className="flex items-center gap-1.5 rounded-full bg-paper-2 py-1 pl-3 pr-2 text-xs">{f.label}<X className="h-3 w-3" /></Link>
              ))}
              <Link href="/products" className="px-2 py-1 text-xs text-beni">Clear all</Link>
            </div>
          )}

          {products.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p, i) => <ProductCard key={p._id} product={p} priority={i < 3} />)}
            </div>
          ) : (
            <div className="mt-8">
              <Empty title="No listed product matches yet" action={{ href: `/rfq${q ? `?need=${encodeURIComponent(q)}` : ""}`, label: "Ask the sourcing desk" }}
                text="Our sourcing desk can locate instruments that are not yet listed. Send the model number or specification and we will reply with availability." />
            </div>
          )}

          {pagination.pages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={n === 1 ? href(sp, {}) : href(sp, { page: String(n) })} aria-current={n === page ? "page" : undefined}
                  className={`grid h-10 w-10 place-items-center rounded-full font-mono text-sm ${n === page ? "bg-beni text-white" : "border border-line hover:border-ink"}`}>{n}</Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
