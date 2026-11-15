import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

// Staging (SITE_INDEXABLE !== "true") blocks all crawling.
export default function robots(): MetadataRoute.Robots {
  if (!site.indexable) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/compare", "/rfq?", "/products?*q=", "/products?*spec=", "/products?*sort="] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
