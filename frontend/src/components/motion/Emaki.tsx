"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export interface EmakiFamily {
  slug: string; name: string; kanji: string; tagline?: string; count: number;
  children: { slug: string; name: string }[]; images: { url: string; alt: string }[];
}

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
// Where the sun sits on the stage for each chapter (percent of the stage box).
const SUN = [[68, 30], [30, 26], [72, 64], [34, 70], [58, 18], [24, 48], [70, 46], [44, 34]];

const plural = (n: number) => `${n} ${n === 1 ? "product" : "products"}`;

// Family atlas: the page scrolls normally. Chapters pass on the left while a sticky
// stage on the right follows along: the sun travels, the kanji changes and the
// family's products cross-fade in. Nothing hijacks the wheel.
export default function Emaki({ families }: { families: EmakiFamily[] }) {
  const [active, setActive] = useState(0);
  const chapters = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
    }, { rootMargin: "-45% 0px -50% 0px" });
    chapters.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [families.length]);

  const go = (i: number) => chapters.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  const current = families[active];
  const [sx, sy] = SUN[active % SUN.length];

  return (
    <section id="families" className="relative border-y border-line bg-paper-2">
      <div className="shell grid gap-6 pb-6 pt-24 sm:pt-32 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Product families</p>
          <h2 className="mt-5 text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">Every discipline, one standard.</h2>
        </div>
        <p className="max-w-sm self-end text-mute lg:col-span-4 lg:col-start-9">
          From the electrician’s multimeter to the sprinkler valve on a high-rise riser, every family is organised by the task it measures or protects.
        </p>
      </div>

      <div className="shell grid gap-10 pb-24 sm:pb-32 lg:grid-cols-12">
        {/* Chapters */}
        <ol className="lg:col-span-5">
          {families.map((f, i) => (
            <li key={f.slug} ref={(el) => { chapters.current[i] = el; }} data-index={i}
              className={`group relative flex flex-col justify-center border-t border-line py-12 transition-opacity duration-500 lg:min-h-[78vh] ${i === active ? "lg:opacity-100" : "lg:opacity-35"}`}>
              <div className="flex items-baseline justify-between">
                <span className="font-mincho text-2xl text-beni">{NUMERALS[i] || i + 1}</span>
                <span className="text-sm text-mute">{f.count ? plural(f.count) : "Sourcing on request"}</span>
              </div>
              <h3 className="mt-6 text-4xl leading-[1.08] sm:text-5xl">
                <Link href={`/categories/${f.slug}`} className="transition-colors hover:text-beni">{f.name}</Link>
              </h3>
              {f.tagline && <p className="mt-4 max-w-md text-lg text-ink-2">{f.tagline}</p>}

              {/* Small screens: the products sit inside the chapter. */}
              <div className="mt-8 grid grid-cols-3 gap-2 lg:hidden">
                {f.images.slice(0, 3).map((img, j) => (
                  <div key={img.url} className={`relative overflow-hidden rounded-sm bg-white ${j === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                    <Image src={img.url} alt={img.alt} fill sizes="50vw" className="object-contain p-3" />
                  </div>
                ))}
                {f.images.length === 0 && (
                  <div className="asanoha col-span-3 grid aspect-[2/1] place-items-center rounded-sm border border-dashed border-line bg-white/70">
                    <span className="font-mincho text-6xl text-beni/80">{f.kanji}</span>
                  </div>
                )}
              </div>

              <ul className="mt-7 flex flex-wrap gap-2">
                {f.children.slice(0, 8).map((c) => (
                  <li key={c.slug}><Link href={`/categories/${c.slug}`} className="inline-block rounded-full border border-line bg-white px-3 py-1 text-xs transition hover:border-beni hover:text-beni">{c.name}</Link></li>
                ))}
              </ul>
              <Link href={`/categories/${f.slug}`} className="mt-8 inline-flex w-fit items-center gap-2 border-b border-ink pb-1 text-sm font-medium transition hover:border-beni hover:text-beni">
                Explore {f.name.toLowerCase()} <ArrowUpRight className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ol>

        {/* Sticky stage (large screens) */}
        <div className="relative hidden lg:col-span-7 lg:block">
          <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-hidden rounded-sm border border-line bg-white" aria-hidden>
            <div className="absolute aspect-square w-[46%] rounded-full bg-beni transition-[left,top] duration-[1400ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
              style={{ left: `${sx}%`, top: `${sy}%`, transform: "translate(-50%, -50%)" }} />
            <div className="absolute inset-x-0 bottom-[22%] h-px bg-ink/80" />

            {families.map((f, i) => (
              <div key={f.slug} className={`absolute inset-0 transition-all duration-700 ${i === active ? "visible opacity-100" : "invisible opacity-0"}`}>
                <span className={`vertical absolute right-8 top-8 font-mincho text-[9rem] font-extrabold leading-none text-ink transition-transform duration-1000 ${i === active ? "translate-y-0" : "translate-y-8"}`}>{f.kanji}</span>
                {f.images[0] && (
                  <div className={`absolute left-[8%] top-[10%] h-[64%] w-[56%] transition-transform duration-1000 ${i === active ? "scale-100" : "scale-90"}`}>
                    <Image src={f.images[0].url} alt="" fill sizes="35vw" className="object-contain drop-shadow-[0_30px_40px_rgba(23,24,26,0.18)]" />
                  </div>
                )}
                {f.images.slice(1, 3).map((img, j) => (
                  <div key={img.url} className={`absolute h-[24%] w-[22%] rounded-sm border border-line bg-white p-3 shadow-[0_20px_40px_-24px_rgba(23,24,26,0.35)] transition-all duration-1000 ${j === 0 ? "bottom-[26%] right-[8%]" : "bottom-[6%] right-[32%]"} ${i === active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
                    style={{ transitionDelay: i === active ? `${200 + j * 120}ms` : "0ms" }}>
                    <div className="relative h-full w-full"><Image src={img.url} alt="" fill sizes="15vw" className="object-contain" /></div>
                  </div>
                ))}
                {f.images.length === 0 && (
                  <p className="absolute bottom-[8%] left-[8%] max-w-xs font-mincho text-2xl leading-snug">Sourced to specification. Send us the model you need.</p>
                )}
              </div>
            ))}

            <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between gap-6">
              <p className="font-mincho text-lg">{current?.name}</p>
              <div className="pointer-events-auto flex gap-1.5">
                {families.map((f, i) => (
                  <button key={f.slug} type="button" tabIndex={-1} onClick={() => go(i)} aria-label={`Show ${f.name}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-beni" : "w-3 bg-ink/20 hover:bg-ink/40"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
