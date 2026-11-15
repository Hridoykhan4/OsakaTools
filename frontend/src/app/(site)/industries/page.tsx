import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "@/components/brand";
import { CtaBand, PageHero } from "@/components/ui";
import { api, safe } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { INDUSTRIES } from "@/lib/site";

export const metadata = pageMetadata("/industries", "Industry applications",
  "How OSAKA TOOL instruments support electrical contracting, industrial maintenance, electronics R&D, healthcare, facilities and fleet service teams.");

export default async function Industries() {
  const { categories } = await safe(api.categories(), { categories: [] });
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  return (
    <>
      <PageHero eyebrow="Applications" title="Industry applications" kanji="現場" crumbs={[{ name: "Industries", path: "/industries" }]}
        intro="Genchi genbutsu (現地現物): understand the work where it happens. We specify instruments from the task outward." />
      <div className="shell mt-6 divide-y divide-line">
        {INDUSTRIES.map((ind, i) => (
          <section key={ind.slug} id={ind.slug} className="reveal grid scroll-mt-24 gap-8 py-14 lg:grid-cols-12">
            <div className="lg:col-span-1"><span className="font-mono text-sm text-beni">{String(i + 1).padStart(2, "0")}</span></div>
            <div className="lg:col-span-5">
              <CategoryIcon name={ind.icon} className="h-8 w-8 text-ink-2" />
              <h2 className="mt-4 text-3xl font-semibold">{ind.name}</h2>
              <p className="mt-3 max-w-md text-mute">{ind.text}</p>
            </div>
            <div className="lg:col-span-6">
              <p className="eyebrow">Recommended categories</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {ind.categories.map((slug) => bySlug.get(slug)).filter(Boolean).map((c) => (
                  <li key={c!.slug}>
                    <Link href={`/categories/${c!.slug}`} className="group flex items-center justify-between rounded-xl border border-line bg-white p-4 text-sm transition hover:border-ink">
                      <span><span className="block font-medium">{c!.name}</span><span className="text-xs text-mute">{c!.tagline}</span></span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-faint group-hover:text-beni" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
      <CtaBand title="Equipping a team or a project?" text="Send the scope of work. We will propose an instrument set matched to the measurement categories, standards and quantities involved." />
    </>
  );
}
