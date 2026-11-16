import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import JsonLd from "./JsonLd";
import { ProductQuickActions } from "./ProductActions";
import { Hanko } from "./brand";
import Tilt from "./motion/Tilt";
import { breadcrumbSchema } from "@/lib/seo";
import type { Category, Product } from "@/lib/types";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbSchema(all)} />
      <nav aria-label="Breadcrumb" className="text-[0.8rem] text-faint">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((item, i) => (
            <li key={item.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-line">/</span>}
              {i === all.length - 1
                ? <span aria-current="page" className="text-mute">{item.name}</span>
                : <Link href={item.path} className="hover:text-beni">{item.name}</Link>}
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
      {kanji && (
        <span aria-hidden className="vertical pointer-events-none absolute right-3 top-6 select-none font-mincho text-[4.5rem] font-extrabold leading-[1.02] text-beni/[0.13] sm:right-10 sm:text-[8rem]">{kanji}</span>
      )}
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-[-9rem] h-72 w-72 rounded-full bg-beni/[0.07] sm:h-96 sm:w-96" />
      <div className="shell relative pb-14 pt-10 sm:pb-20 sm:pt-14">
        <Breadcrumbs items={crumbs} />
        <p className="eyebrow reveal mt-10">{eyebrow}</p>
        <h1 className="display reveal mt-5 max-w-4xl pr-16 text-[2.6rem] sm:pr-32 sm:text-6xl lg:text-7xl">{title}</h1>
        {intro && <p className="reveal mt-6 max-w-2xl text-lg leading-relaxed text-mute">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, intro, action, kanji }: { eyebrow: string; title: string; intro?: string; action?: { href: string; label: string }; kanji?: string }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="relative max-w-2xl">
        {kanji && <span aria-hidden className="absolute -left-2 -top-12 select-none font-mincho text-8xl font-extrabold text-beni/[0.09]">{kanji}</span>}
        <p className="eyebrow relative">{eyebrow}</p>
        <h2 className="relative mt-4 text-3xl sm:text-[2.9rem] sm:leading-[1.08]">{title}</h2>
        {intro && <p className="relative mt-4 text-mute">{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex shrink-0 items-center gap-2 border-b border-ink pb-1 text-sm font-medium transition hover:border-beni hover:text-beni">
          {action.label}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const category = typeof product.category === "object" ? product.category : null;
  const keySpecs = product.specifications.filter((s) => s.filterable).slice(0, 3);
  const code = product.modelNumber || product.sku;
  return (
    <article className="group relative flex h-full flex-col">
      <Tilt trackParent className="relative aspect-square rounded-sm bg-paper-2">
        <span aria-hidden className="absolute inset-0 overflow-hidden rounded-sm">
          <span className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition duration-700 group-hover:scale-110" />
        </span>
        {product.images[0] ? (
          <div className="z-2 pointer-events-none absolute inset-0">
            <Image src={product.images[0].url} alt={product.images[0].alt || product.name} fill priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 100vw" className="object-contain p-8 mix-blend-multiply transition duration-700 group-hover:scale-[1.05]" />
          </div>
        ) : <div className="relative grid h-full place-items-center font-mincho text-5xl text-faint">工</div>}
        <span aria-hidden className="sheen pointer-events-none absolute inset-0 rounded-sm" />
        {code && <span className="z-3 absolute left-3 top-3 rounded-sm bg-white/90 px-2 py-0.5 font-mono text-[0.68rem] text-ink-2">{code}</span>}
        <div className="z-3 pointer-events-none absolute inset-0 [&>div]:pointer-events-auto">
          <ProductQuickActions product={{ id: product._id, slug: product.slug, name: product.name, sku: product.sku || product.modelNumber, image: product.images[0]?.url }} />
        </div>
      </Tilt>
      <div className="flex flex-1 flex-col pt-4">
        {category && <p className="text-xs text-beni">{category.name}</p>}
        <h3 className="mt-1.5 font-mincho text-[1.12rem] font-semibold leading-snug">
          <Link href={`/products/${product.slug}`}
            className="bg-[linear-gradient(var(--color-beni),var(--color-beni))] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 after:absolute after:inset-0 group-hover:bg-[length:100%_1px]">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-mute">{product.manufacturer}</p>
        {keySpecs.length > 0 && (
          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
            {keySpecs.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="truncate text-[0.68rem] text-faint">{s.label}</dt>
                <dd className="truncate font-mono text-[0.8rem]">{s.value}{s.unit ? ` ${s.unit}` : ""}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}

export function CategoryTile({ category }: { category: Category; index?: number }) {
  return (
    <Link href={`/categories/${category.slug}`} className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-sm border border-line bg-white p-6 transition duration-500 hover:border-beni">
      {category.image?.url ? (
        <div className="relative -mx-6 -mt-6 mb-5 aspect-[16/9] overflow-hidden bg-paper-2">
          <Image src={category.image.url} alt="" fill sizes="(min-width:1024px) 30vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <span aria-hidden className="font-mincho text-5xl text-beni/80">{category.isMedical ? "医" : "工"}</span>
          <ArrowUpRight className="h-5 w-5 text-faint transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-beni" />
        </div>
      )}
      <div>
        <h3 className="text-xl leading-tight">{category.name}</h3>
        {category.tagline && <p className="mt-2 line-clamp-2 text-sm text-mute">{category.tagline}</p>}
        <p className="mt-4 text-xs text-faint">{category.productCount ? `${category.productCount} ${category.productCount === 1 ? "product" : "products"}` : "Sourcing on request"}</p>
      </div>
    </Link>
  );
}

export function CtaBand({ title = "Specify, compare and request a quote in one place.", text = "Send your bill of materials or a single model number. Our engineers respond with availability, lead time and documentation." }: { title?: string; text?: string }) {
  return (
    <section className="shell mt-28">
      <div className="seigaiha relative overflow-hidden rounded-sm border border-line px-5 py-14 sm:px-14 sm:py-24">
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-beni sm:-right-10 sm:-top-10 sm:h-96 sm:w-96" />
        <div className="relative max-w-2xl rounded-sm bg-paper/90 p-6 backdrop-blur-sm sm:p-10">
          <div className="flex items-center gap-4"><Hanko className="h-12 w-12" /><p className="eyebrow">Request for quotation</p></div>
          <h2 className="mt-6 text-3xl sm:text-5xl sm:leading-[1.08]">{title}</h2>
          <p className="mt-5 text-ink-2">{text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/rfq" className="btn btn-primary">Start a quote request <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/products" className="btn btn-ghost">Browse the catalogue</Link>
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
    <div className="asanoha flex flex-col items-center rounded-sm border border-line bg-white px-6 py-16 text-center">
      <span aria-hidden className="font-mincho text-5xl text-beni/70">空</span>
      <p className="mt-4 font-mincho text-xl font-semibold">{title}</p>
      <p className="mt-3 max-w-md text-mute">{text}</p>
      {action && <Link href={action.href} className="btn btn-primary mt-6">{action.label}<ArrowRight className="h-4 w-4" /></Link>}
    </div>
  );
}
