import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { Breadcrumbs, CtaBand, Markdown } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { absoluteUrl, entityId, pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try { return await api.article(slug); } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { post } = await load((await params).slug);
  const meta = pageMetadata(`/resources/${post.slug}`, post.seo?.title || post.title, post.seo?.description || post.excerpt, { image: post.coverImage?.url || undefined });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: post.publishedAt, modifiedTime: post.updatedAt } };
}

export default async function Article({ params }: Params) {
  const { post, related } = await load((await params).slug);
  const headings = (post.content || "").split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
  const schema = { "@context": "https://schema.org", "@type": "TechArticle", headline: post.title, description: post.excerpt,
    datePublished: post.publishedAt, dateModified: post.updatedAt, author: { "@type": "Organization", name: post.author },
    publisher: { "@id": entityId }, mainEntityOfPage: absoluteUrl(`/resources/${post.slug}`), keywords: post.tags.join(", ") };
  return (
    <>
      <JsonLd data={schema} />
      <article>
        <header className="border-b border-line">
          <div className="shell max-w-4xl pb-12 pt-10">
            <Breadcrumbs items={[{ name: "Resources", path: "/resources" }, { name: post.title, path: `/resources/${post.slug}` }]} />
            <p className="eyebrow mt-10">{post.category}</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl">{post.title}</h1>
            <p className="mt-6 text-lg text-mute">{post.excerpt}</p>
            <p className="mt-8 text-xs text-faint">
              {post.author} · <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</time> · {post.readingMinutes} min read
            </p>
          </div>
        </header>
        <div className="shell mt-12 grid max-w-6xl gap-12 lg:grid-cols-12">
          {headings.length > 2 && (
            <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-24">
                <p className="eyebrow">On this page</p>
                <ul className="mt-4 space-y-2 border-l border-line pl-4 text-sm">
                  {headings.map((h) => <li key={h}><a href={`#${h.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="text-mute hover:text-ink">{h}</a></li>)}
                </ul>
              </div>
            </nav>
          )}
          <div className={headings.length > 2 ? "lg:col-span-9" : "lg:col-span-12"}><Markdown text={post.content || ""} /></div>
        </div>
      </article>
      {post.relatedCategories.length > 0 && (
        <div className="shell mt-12 max-w-6xl">
          <p className="eyebrow">Related categories</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {post.relatedCategories.map((slug) => <Link key={slug} href={`/categories/${slug}`} className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">{slug.replace(/-/g, " ")}</Link>)}
          </div>
        </div>
      )}
      {related.length > 0 && (
        <div className="shell mt-16 max-w-6xl">
          <p className="eyebrow">Continue reading</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((r) => <Link key={r._id} href={`/resources/${r.slug}`} className="card p-6 transition hover:border-ink"><p className="font-semibold leading-snug">{r.title}</p></Link>)}
          </div>
        </div>
      )}
      <CtaBand />
    </>
  );
}

// Rendered on first request, then cached and refreshed in the background (ISR).
export async function generateStaticParams() { return []; }
