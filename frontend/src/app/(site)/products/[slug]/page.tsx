import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BadgeCheck, Download, FileText, ShieldCheck } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import ProductGallery from "@/components/ProductGallery";
import { ProductBuyBox } from "@/components/ProductActions";
import { Breadcrumbs, CtaBand, Markdown, ProductCard, SectionHead } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { absoluteUrl, descriptionText, entityId, pageMetadata } from "@/lib/seo";
import type { Brand, Category, Product, Spec } from "@/lib/types";

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try { return await api.product(slug); } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { product: p } = await load((await params).slug);
  const prefixed = p.manufacturer && !p.name.toLowerCase().startsWith(p.manufacturer.toLowerCase());
  const title = p.seo?.title || (prefixed ? `${p.manufacturer} ${p.name}` : p.name);
  return pageMetadata(`/products/${p.slug}`, title, p.seo?.description || p.shortDescription || p.description,
    { image: p.images[0]?.url, noindex: p.seo?.noindex, canonical: p.seo?.canonical || undefined });
}

function groupSpecs(specs: Spec[]) {
  const groups = new Map<string, Spec[]>();
  for (const s of specs) groups.set(s.group || "General", [...(groups.get(s.group || "General") || []), s]);
  return [...groups.entries()];
}

export default async function ProductPage({ params }: Params) {
  const { product: p, related } = await load((await params).slug);
  const category = typeof p.category === "object" ? (p.category as Category) : null;
  const brand = p.brand && typeof p.brand === "object" ? (p.brand as Brand) : null;
  const parent = category && typeof category.parent === "object" && category.parent ? category.parent : null;
  const groups = groupSpecs(p.specifications);
  const registered = (p.regulatory?.markets || []).filter((m) => m.status === "registered");

  // Product structured data contains only facts present on the page: no prices, ratings or reviews are invented.
  const schema = {
    "@context": "https://schema.org", "@type": "Product", "@id": `${absoluteUrl(`/products/${p.slug}`)}#product`,
    name: p.name, description: descriptionText(p.description || p.shortDescription), url: absoluteUrl(`/products/${p.slug}`),
    image: p.images.map((i) => i.url), sku: p.sku || undefined, mpn: p.modelNumber || undefined, gtin: p.gtin || undefined,
    brand: { "@type": "Brand", name: brand?.name || p.manufacturer },
    manufacturer: p.manufacturer ? { "@type": "Organization", name: p.manufacturer } : undefined,
    countryOfOrigin: p.originVerified && p.countryOfOrigin ? p.countryOfOrigin : undefined,
    category: category?.name, additionalProperty: p.specifications.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value, unitText: s.unit || undefined })),
    seller: { "@id": entityId },
  };
  const crumbs = [{ name: "Products", path: "/products" },
    ...(parent ? [{ name: parent.name, path: `/categories/${parent.slug}` }] : []),
    ...(category ? [{ name: category.name, path: `/categories/${category.slug}` }] : []),
    { name: p.name, path: `/products/${p.slug}` }];

  return (
    <>
      <JsonLd data={schema} />
      <div className="shell pt-8"><Breadcrumbs items={crumbs} /></div>

      <section className="shell mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7"><ProductGallery images={p.images} name={p.name} /></div>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            {category && <Link href={`/categories/${category.slug}`} className="font-mono text-xs uppercase tracking-[0.14em] text-beni">{category.name}</Link>}
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-[2.6rem] sm:leading-[1.05]">{p.name}</h1>
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm">
              {[["Manufacturer", p.manufacturer], ["Model", p.modelNumber], ["SKU", p.sku], ["Warranty", p.warranty],
                ["Country of origin", p.originVerified ? p.countryOfOrigin : ""], ["Minimum order", p.moq && p.moq > 1 ? `${p.moq} units` : ""], ["Lead time", p.leadTime]]
                .filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="bg-white p-4">
                    <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-faint">{k}</dt>
                    <dd className="mt-1 font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
            {p.shortDescription && <p className="mt-6 leading-relaxed text-mute">{p.shortDescription}</p>}

            {p.regulatory?.isMedical && (
              <div className="mt-6 rounded-2xl border border-ai/30 bg-ai-soft p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-ai"><ShieldCheck className="h-4 w-4" />Medical device: market eligibility</p>
                {registered.length ? (
                  <ul className="mt-2 space-y-1">{registered.map((m) => <li key={m.region}>{m.region}{m.authority ? ` · ${m.authority}` : ""}{m.registrationNo ? ` · ${m.registrationNo}` : ""}</li>)}</ul>
                ) : <p className="mt-2">Registration documentation is under review. This device is not offered for sale until it is verified.</p>}
              </div>
            )}

            <div className="mt-8">
              <ProductBuyBox product={{ id: p._id, slug: p.slug, name: p.name, sku: p.sku || p.modelNumber, image: p.images[0]?.url }} moq={p.moq} />
            </div>
            <p className="mt-4 text-xs text-faint">Quotations include availability, lead time and documentation. Pricing depends on quantity and destination.</p>
          </div>
        </div>
      </section>

      <section className="shell mt-20 grid gap-12 lg:grid-cols-12">
        <div className="space-y-14 lg:col-span-8">
          {groups.length > 0 && (
            <div>
              <SectionHead eyebrow="Technical data" title="Specifications" />
              <div className="mt-8 space-y-8">
                {groups.map(([group, specs]) => (
                  <div key={group}>
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-faint">{group}</p>
                    <dl className="mt-3 divide-y divide-line border-y border-line">
                      {specs.map((s) => (
                        <div key={s.label} className="grid grid-cols-2 gap-4 py-3 text-sm">
                          <dt className="text-mute">{s.label}</dt>
                          <dd className="font-mono">{s.value}{s.unit ? ` ${s.unit}` : ""}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.features.length > 0 && (
            <div>
              <SectionHead eyebrow="Capabilities" title="Features" />
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {p.features.map((f) => <li key={f} className="flex gap-3 rounded-xl border border-line bg-white p-4 text-sm"><BadgeCheck className="h-5 w-5 shrink-0 text-beni" strokeWidth={1.5} />{f}</li>)}
              </ul>
            </div>
          )}

          {p.description && p.description !== p.shortDescription && (
            <div>
              <SectionHead eyebrow="Overview" title="Product description" />
              <div className="mt-6"><Markdown text={p.description} /></div>
            </div>
          )}

          {p.regulatory?.isMedical && p.regulatory.intendedUse && (
            <div className="rounded-2xl border border-line p-6">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-warn" />Intended use</p>
              <p className="mt-2 text-sm text-mute">{p.regulatory.intendedUse}</p>
            </div>
          )}
        </div>

        <aside className="space-y-8 lg:col-span-4">
          <div className="card p-6">
            <p className="eyebrow">Documents</p>
            {p.documents.length ? (
              <ul className="mt-4 space-y-2">
                {p.documents.map((d) => (
                  <li key={d.url}>
                    <a href={d.url} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm transition hover:border-ink">
                      <FileText className="h-5 w-5 shrink-0 text-beni" strokeWidth={1.5} />
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium">{d.title}</span><span className="font-mono text-xs uppercase text-faint">{d.kind}</span></span>
                      <Download className="h-4 w-4 text-faint" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-mute">Datasheets and certificates are supplied with quotations. <Link href={`/rfq?need=${encodeURIComponent(`Datasheet for ${p.modelNumber || p.name}`)}`} className="text-beni underline-offset-4 hover:underline">Request documents</Link></p>
            )}
          </div>
          {p.inBox.length > 0 && (
            <div className="card p-6">
              <p className="eyebrow">In the box</p>
              <ul className="mt-4 space-y-1.5 text-sm">{p.inBox.map((i) => <li key={i}>— {i}</li>)}</ul>
            </div>
          )}
          {p.certifications.length > 0 && (
            <div className="card p-6">
              <p className="eyebrow">Declared conformity</p>
              <div className="mt-4 flex flex-wrap gap-2">{p.certifications.map((c) => <span key={c} className="rounded-full border border-line px-3 py-1 font-mono text-xs">{c}</span>)}</div>
            </div>
          )}
        </aside>
      </section>

      {related.length > 0 && (
        <section className="shell mt-24">
          <SectionHead eyebrow="Same category" title="Related products" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((r: Product) => <ProductCard key={r._id} product={r} />)}</div>
        </section>
      )}
      <CtaBand title="Need this in volume, or an equivalent model?" />
    </>
  );
}
