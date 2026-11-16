import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import InquiryForm from "@/components/InquiryForm";
import { familyWord } from "@/components/brand";
import { CategoryTile, CtaBand, Markdown, PageHero, ProductCard, SectionHead } from "@/components/ui";
import { api, ApiError, safe } from "@/lib/api";
import { collectionSchema, pageMetadata } from "@/lib/seo";
import type { Product } from "@/lib/types";

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try { return await api.category(slug); } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category: c } = await load((await params).slug);
  return pageMetadata(`/categories/${c.slug}`, c.seo?.title || c.name, c.seo?.description || `${c.description} ${c.tagline || ""}`.trim(), { noindex: c.seo?.noindex });
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const { category: c, children } = await load(slug);
  const [{ products }, { posts }] = await Promise.all([
    safe(api.products({ category: c.slug, limit: 48 }), { products: [] as Product[], pagination: { page: 1, limit: 48, total: 0, pages: 1 } }),
    safe(api.articles({ category: c.slug, limit: 3 }), { posts: [], pagination: { page: 1, limit: 3, total: 0, pages: 1 } }),
  ]);
  const parent = typeof c.parent === "object" && c.parent ? c.parent : null;
  const crumbs = [{ name: "Categories", path: "/categories" }, ...(parent ? [{ name: parent.name, path: `/categories/${parent.slug}` }] : []), { name: c.name, path: `/categories/${c.slug}` }];

  return (
    <>
      <JsonLd data={collectionSchema(`/categories/${c.slug}`, c.name, products.map((p) => ({ name: p.name, path: `/products/${p.slug}` })))} />
      <PageHero eyebrow={parent ? parent.name : "Product family"} title={c.name} intro={c.description} crumbs={crumbs} kanji={familyWord(parent?.slug || c.slug)}>
        {c.isMedical && (
          <p className="mt-8 inline-flex max-w-2xl items-start gap-3 rounded-sm border border-ai/30 bg-ai-soft p-4 text-sm text-ink-2">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ai" />Medical devices are listed only with documented market registration, and each listing names the markets where the device may be supplied.
          </p>
        )}
      </PageHero>

      {children.length > 0 && (
        <section className="shell mt-14">
          <SectionHead eyebrow="Subcategories" title={`Inside ${c.name}`} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children.map((x, i) => <CategoryTile key={x._id} category={x} index={i} />)}</div>
        </section>
      )}

      <section className="shell mt-16">
        <SectionHead eyebrow="Catalogue" title={products.length ? `${products.length} listed ${products.length === 1 ? "product" : "products"}` : "Sourced to your specification"}
          action={products.length ? { href: `/products?category=${c.slug}`, label: "Filter by specification" } : undefined} />
        {products.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        ) : (
          <div className="mt-8 grid gap-8 rounded-sm border border-line bg-white p-6 sm:p-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xl font-semibold">Listings for this category are being prepared.</p>
              <p className="mt-3 text-mute">Our sourcing desk supplies {c.name.toLowerCase()} to specification now. Share the model, standard or measurement range you need, and we will confirm availability, manufacturer and documentation.</p>
            </div>
            <div className="lg:col-span-7"><InquiryForm type="sourcing" compact defaultMessage={`Category: ${c.name}\nRequirement: `} submitLabel="Request sourcing" /></div>
          </div>
        )}
      </section>

      {c.guide && (
        <section className="shell mt-20 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4"><p className="eyebrow">Buyer guidance</p><h2 className="mt-4 text-3xl font-semibold">How to choose {c.name.toLowerCase()}</h2></div>
          <div className="lg:col-span-8"><Markdown text={c.guide} /></div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="shell mt-20">
          <SectionHead eyebrow="Related reading" title="Technical articles" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <Link key={post._id} href={`/resources/${post.slug}`} className="group card p-6 transition hover:border-ink">
                <p className="text-xs text-beni">{post.category}</p>
                <p className="mt-3 font-semibold leading-snug">{post.title}</p>
                <ArrowUpRight className="mt-6 h-4 w-4 text-faint group-hover:text-beni" />
              </Link>
            ))}
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}

// Rendered on first request, then cached and refreshed in the background (ISR).
export async function generateStaticParams() { return []; }
