import Link from "next/link";
import { ArrowRight } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { CategoryIcon } from "@/components/brand";
import { CategoryTile, CtaBand, PageHero } from "@/components/ui";
import { api, safe } from "@/lib/api";
import { collectionSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/categories", "Product categories",
  "Browse OSAKA TOOL product families: electrical test and measurement, electronics and laboratory instruments, industrial measurement, industrial tools, environmental monitoring and medical diagnostic devices.");

export default async function Categories() {
  const { categories } = await safe(api.categories(), { categories: [] });
  const top = categories.filter((c) => !c.parent);
  const children = (id: string) => categories.filter((c) => String(typeof c.parent === "object" ? c.parent?._id : c.parent) === id);
  return (
    <>
      <JsonLd data={collectionSchema("/categories", "Product categories", categories.map((c) => ({ name: c.name, path: `/categories/${c.slug}` })))} />
      <PageHero eyebrow="Catalogue structure" title="Product categories" kanji="分類" crumbs={[{ name: "Categories", path: "/categories" }]}
        intro="Organised by measurement task, so you can move from requirement to instrument quickly." />
      <div className="shell mt-16 space-y-20">
        {top.map((c) => (
          <section key={c._id} className="reveal grid gap-8 lg:grid-cols-12" aria-labelledby={`h-${c.slug}`}>
            <div className="lg:col-span-4">
              <CategoryIcon name={c.icon} className="h-8 w-8 text-beni" />
              <h2 id={`h-${c.slug}`} className="mt-4 text-3xl font-semibold">{c.name}</h2>
              <p className="mt-3 text-mute">{c.description}</p>
              <Link href={`/categories/${c.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-beni">Open family <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {children(c._id).map((x, i) => <CategoryTile key={x._id} category={x} index={i} />)}
            </div>
          </section>
        ))}
      </div>
      <CtaBand />
    </>
  );
}
