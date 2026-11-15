import Header, { type NavCategory } from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import SmoothScroll from "@/components/motion/SmoothScroll";
import JsonLd from "@/components/JsonLd";
import { CompareBar } from "@/components/ProductActions";
import { api, loadSettings, safe } from "@/lib/api";
import { absoluteUrl, entityId, websiteId } from "@/lib/seo";
import { site } from "@/lib/site";

// Rendered per request against the in-process API cache; nothing depends on the API at build time.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ categories }, settings] = await Promise.all([safe(api.categories(), { categories: [] }), loadSettings()]);
  const parentId = (c: (typeof categories)[number]) => (typeof c.parent === "object" && c.parent ? c.parent._id : c.parent) || null;
  const nav: NavCategory[] = categories.filter((c) => !parentId(c)).map((c) => ({
    slug: c.slug, name: c.name, icon: c.icon, tagline: c.tagline,
    children: categories.filter((x) => parentId(x) === c._id).map((x) => ({ slug: x.slug, name: x.name })),
  }));

  // Organization facts are limited to what this site can substantiate.
  const organization = { "@context": "https://schema.org", "@type": "Organization", "@id": entityId, name: site.name, url: site.url,
    logo: absoluteUrl("/icon.svg"), description: site.description,
    contactPoint: [{ "@type": "ContactPoint", contactType: "sales", email: settings.contact.email || site.email, ...(settings.contact.phone ? { telephone: settings.contact.phone } : {}), availableLanguage: ["English"] }],
    ...(Object.values(settings.social).some(Boolean) ? { sameAs: Object.values(settings.social).filter(Boolean) } : {}) };
  const website = { "@context": "https://schema.org", "@type": "WebSite", "@id": websiteId, name: site.name, url: site.url, publisher: { "@id": entityId },
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${site.url}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string" } };

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={organization} />
      <JsonLd data={website} />
      <Header categories={nav} announcement={settings.announcement} />
      <main id="main" className="flex-1">{children}</main>
      <Footer settings={settings} />
      <CompareBar />
      <Reveal />
      <SmoothScroll />
    </div>
  );
}
