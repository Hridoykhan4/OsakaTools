import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import JsonLd from "./JsonLd";
import { ProductQuickActions } from "./ProductActions";
import { breadcrumbSchema } from "@/lib/seo";
import type { Category, Product } from "@/lib/types";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbSchema(all)} />
      <nav aria-label="Breadcrumb" className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-faint">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((item, i) => (
            <li key={item.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-line">/</span>}
              {i === all.length - 1
                ? <span aria-current="page" className="text-mute">{item.name}</span>
                : <Link href={item.path} className="hover:text-ink">{item.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function PageHero({ eyebrow, title, intro, crumbs, children, kanji }: {
  eyebrow: string; title: string; intro?: string; crumbs: { name: string; path: string }[]; children?: React.ReactNode; kanji?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="grid-paper pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      {kanji && <span aria-hidden className="pointer-events-none absolute -right-6 top-6 select-none font-jp text-[9rem] font-bold leading-none text-ink/[0.035] sm:text-[14rem]">{kanji}</span>}
      <div className="shell relative pb-14 pt-10 sm:pb-20 sm:pt-14">
        <Breadcrumbs items={crumbs} />
        <p className="eyebrow mt-10">{eyebrow}</p>
        <h1 className="display mt-5 max-w-4xl text-[2.6rem] sm:text-6xl lg:text-7xl">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, intro, action }: { eyebrow: string; title: string; intro?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-semibold sm:text-[2.6rem] sm:leading-[1.05]">{title}</h2>
        {intro && <p className="mt-4 text-mute">{intro}</p>}
      </div>
      {action && <Link href={action.href} className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium">{action.label}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>}
    </div>
  );
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const category = typeof product.category === "object" ? product.category : null;
  const keySpecs = product.specifications.filter((s) => s.filterable).slice(0, 3);
  return (
    <article className="group card relative flex flex-col overflow-hidden transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(22,24,27,0.35)]">
      <div className="relative aspect-[4/3.3] overflow-hidden bg-gradient-to-b from-white to-paper">
        {product.images[0] ? (
          <Image src={product.images[0].url} alt={product.images[0].alt || product.name} fill priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 100vw" className="object-contain p-7 transition duration-700 group-hover:scale-[1.04]" />
        ) : <div className="grid h-full place-items-center font-mono text-xs text-faint">Image pending</div>}
        <span className="absolute left-4 top-4 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">{product.modelNumber || product.sku}</span>
        <ProductQuickActions product={{ id: product._id, slug: product.slug, name: product.name, sku: product.sku || product.modelNumber, image: product.images[0]?.url }} />
      </div>
      <div className="flex flex-1 flex-col border-t border-line-2 p-5">
        {category && <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-beni">{category.name}</p>}
        <h3 className="mt-2 text-[1.05rem] font-semibold leading-snug">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">{product.name}</Link>
        </h3>
        <p className="mt-1 text-sm text-mute">{product.manufacturer}</p>
        {keySpecs.length > 0 && (
          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-dashed border-line pt-3">
            {keySpecs.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="truncate text-[0.65rem] uppercase tracking-wide text-faint">{s.label}</dt>
                <dd className="truncate font-mono text-[0.8rem]">{s.value}{s.unit ? ` ${s.unit}` : ""}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}

export function CategoryTile({ category, index }: { category: Category; index?: number }) {
  return (
    <Link href={`/categories/${category.slug}`} className="group card relative flex min-h-56 flex-col justify-between overflow-hidden p-6 transition duration-500 hover:border-ink">
      <div className="flex items-start justify-between">
        {index !== undefined && <span className="font-mono text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>}
        <ArrowUpRight className="h-5 w-5 text-faint transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-beni" />
      </div>
      <div>
        <h3 className="text-xl font-semibold leading-tight">{category.name}</h3>
        {category.tagline && <p className="mt-2 text-sm text-mute">{category.tagline}</p>}
        <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-faint">
          {category.productCount ? `${category.productCount} listed` : "Sourcing on request"}
        </p>
      </div>
    </Link>
  );
}

export function CtaBand({ title = "Specify, compare and request a quote in one place.", text = "Send your bill of materials or a single model number. Our engineers respond with availability, lead time and documentation." }: { title?: string; text?: string }) {
  return (
    <section className="shell mt-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-paper sm:px-12 sm:py-20">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-beni/90 blur-[2px]" />
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/20" style={{ transform: "scale(1.35)" }} />
        <div className="relative max-w-2xl">
          <p className="eyebrow !text-silver">Request for quotation</p>
          <h2 className="mt-5 text-3xl font-semibold sm:text-5xl sm:leading-[1.02]">{title}</h2>
          <p className="mt-5 text-silver">{text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/rfq" className="btn btn-red">Start an RFQ <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/products" className="btn border border-white/25 text-paper hover:border-white">Browse catalogue</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Minimal, safe markdown: "## " / "### " headings, "- " lists, paragraphs, **bold**.
export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part);
  return (
    <div className="prose-tech">
      {blocks.map((block, i) => {
        const b = block.trim();
        if (!b) return null;
        if (b.startsWith("### ")) return <h3 key={i}>{inline(b.slice(4))}</h3>;
        if (b.startsWith("## ")) return <h2 key={i} id={b.slice(3).toLowerCase().replace(/[^a-z0-9]+/g, "-")}>{inline(b.slice(3))}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.trim().slice(2))}</li>)}</ul>;
        return <p key={i}>{inline(b.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="card grid-paper flex flex-col items-center px-6 py-16 text-center">
      <p className="text-xl font-semibold">{title}</p>
      <p className="mt-3 max-w-md text-mute">{text}</p>
      {action && <Link href={action.href} className="btn btn-primary mt-6">{action.label}<ArrowRight className="h-4 w-4" /></Link>}
    </div>
  );
}
