import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const STATIC = ["/", "/products", "/categories", "/industries", "/technology", "/quality", "/distribution", "/rfq", "/resources", "/about", "/contact"];
const date = (v?: string) => { const d = v ? new Date(v) : undefined; return d && Number.isFinite(d.getTime()) ? d : undefined; };

// Database-driven. A failed API call fails the sitemap rather than serving a truncated one.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ categories }, first, articles] = await Promise.all([api.categories(), api.products({ limit: 100 }), api.articles({ limit: 50 })]);
  const products = [...first.products];
  for (let page = 2; page <= first.pagination.pages; page++) products.push(...(await api.products({ page, limit: 100 })).products);
  const posts = [...articles.posts];
  for (let page = 2; page <= articles.pagination.pages; page++) posts.push(...(await api.articles({ page, limit: 50 })).posts);
  return [
    ...STATIC.map((path) => ({ url: absoluteUrl(path) })),
    ...categories.filter((c) => !c.seo?.noindex).map((c) => ({ url: absoluteUrl(`/categories/${c.slug}`), lastModified: date(c.updatedAt) })),
    ...products.filter((p) => !p.seo?.noindex).map((p) => ({ url: absoluteUrl(`/products/${p.slug}`), lastModified: date(p.updatedAt), images: p.images.map((i) => i.url) })),
    ...posts.map((p) => ({ url: absoluteUrl(`/resources/${p.slug}`), lastModified: date(p.updatedAt) })),
  ];
}
