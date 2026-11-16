import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { CtaBand, Empty, PageHero } from "@/components/ui";
import { api, safe } from "@/lib/api";
import { collectionSchema, pageMetadata, pageNumber } from "@/lib/seo";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page);
  return pageMetadata(page > 1 ? `/resources?page=${page}` : "/resources", page > 1 ? `Technical resources — page ${page}` : "Technical resources",
    "Engineering guides on measurement categories, True RMS, oscilloscope selection, insulation testing and medical device accuracy from the OSAKA TOOL engineering desk.");
}

export default async function Resources({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page);
  const { posts, pagination } = await safe(api.articles({ page, limit: 12 }), { posts: [], pagination: { page: 1, limit: 12, total: 0, pages: 1 } });
  const [lead, ...rest] = posts;
  return (
    <>
      <JsonLd data={collectionSchema("/resources", "Technical resources", posts.map((p) => ({ name: p.title, path: `/resources/${p.slug}` })))} />
      <PageHero eyebrow="Engineering desk" title="Technical resources" kanji="技術" crumbs={[{ name: "Resources", path: "/resources" }]}
        intro="Practical guidance on selecting, using and specifying instruments, written for engineers and buyers." />
      <div className="shell mt-12">
        {!lead ? <Empty title="Articles are on the way" text="Our engineering desk is preparing technical guides." /> : (
          <>
            <Link href={`/resources/${lead.slug}`} className="group card grid overflow-hidden transition hover:border-ink lg:grid-cols-2">
              <div className="grid-paper relative flex min-h-56 items-end bg-paper-2 p-8 text-ink">
                <p className="text-xs text-beni">{lead.category} · {lead.readingMinutes} min</p>
              </div>
              <div className="p-8 sm:p-10">
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">{lead.title}</h2>
                <p className="mt-4 text-mute">{lead.excerpt}</p>
                <p className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-beni">Read article <ArrowUpRight className="h-4 w-4" /></p>
              </div>
            </Link>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <Link key={post._id} href={`/resources/${post.slug}`} className="reveal group card flex flex-col justify-between p-7 transition hover:border-ink">
                  <div>
                    <p className="text-xs text-beni">{post.category}</p>
                    <h2 className="mt-4 text-lg font-semibold leading-snug">{post.title}</h2>
                    <p className="mt-3 line-clamp-3 text-sm text-mute">{post.excerpt}</p>
                  </div>
                  <p className="mt-8 flex items-center justify-between font-mono text-xs text-faint">{post.readingMinutes} min read <ArrowUpRight className="h-4 w-4 group-hover:text-beni" /></p>
                </Link>
              ))}
            </div>
          </>
        )}
        {pagination.pages > 1 && (
          <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={n === 1 ? "/resources" : `/resources?page=${n}`} aria-current={n === page ? "page" : undefined}
                className={`grid h-10 w-10 place-items-center rounded-full font-mono text-sm ${n === page ? "bg-beni text-white" : "border border-line"}`}>{n}</Link>
            ))}
          </nav>
        )}
      </div>
      <CtaBand />
    </>
  );
}
