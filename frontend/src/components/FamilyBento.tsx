import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Tilt from "./motion/Tilt";

export interface Family {
  slug: string; name: string; kanji: string; tagline?: string; count: number;
  children: { slug: string; name: string }[]; images: { url: string; alt: string }[];
}

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const plural = (n: number) => `${n} ${n === 1 ? "product" : "products"}`;

// Product families as a bento of 3D cards: each tilts toward the pointer and its
// product floats forward off the card. Normal scrolling throughout.
export default function FamilyBento({ families }: { families: Family[] }) {
  return (
    <section id="families" className="shell scroll-mt-24 py-24 sm:py-32">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Product families</p>
          <h2 className="mt-5 text-4xl leading-[1.05] sm:text-6xl">Every discipline, one standard.</h2>
        </div>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[19rem]">
        {families.map((f, i) => {
          const hero = i === 0;
          // Fill the last row: when two small cards are left over, each takes two columns.
          const wide = !hero && (families.length - 1) % 4 === 2 && i >= families.length - 2;
          return (
            <Tilt key={f.slug} max={hero ? 6 : 9} className={`group relative ${hero ? "sm:col-span-2 lg:row-span-2" : wide ? "lg:col-span-2" : ""}`}>
              <Link href={`/categories/${f.slug}`} className="relative flex h-full min-h-[19rem] flex-col rounded-md border border-line bg-white p-6 transition-colors duration-500 hover:border-beni/50 [transform-style:preserve-3d] sm:p-7">
                {/* Clipped back layer: the sun that rises on hover and the family kanji. */}
                <span aria-hidden className="absolute inset-0 overflow-hidden rounded-md">
                <span className={`absolute rounded-full bg-beni transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.1,1)] ${hero ? "right-[12%] top-[16%] h-[52%] aspect-square" : "right-[10%] top-[14%] h-[46%] aspect-square"} scale-[0.35] opacity-90 group-hover:scale-100`} />
                <span className={`absolute select-none font-mincho font-extrabold leading-none text-ink/[0.06] ${hero ? "-left-2 bottom-2 text-[16rem]" : "-left-1 bottom-0 text-[9rem]"}`}>{f.kanji}</span>
                </span>

                <div className="z-1 relative flex items-baseline justify-between">
                  <span className="font-mincho text-xl text-beni">{NUMERALS[i] || i + 1}</span>
                  <span className="text-xs text-mute">{f.count ? plural(f.count) : "Sourcing on request"}</span>
                </div>

                <div className={`z-3 pointer-events-none relative flex-1 ${hero ? "my-4" : "my-2"}`}>
                  {f.images[0] ? (
                    <Image src={f.images[0].url} alt="" fill sizes={hero ? "(min-width:1024px) 45vw, 90vw" : "(min-width:1024px) 22vw, 45vw"}
                      className="object-contain transition-transform duration-700 group-hover:scale-[1.06]" />
                  ) : (
                    <span aria-hidden className="absolute inset-0 grid place-items-center font-mincho text-7xl font-extrabold text-white/0 transition-colors duration-700 group-hover:text-white">{f.kanji}</span>
                  )}
                </div>

                <div className="z-2 relative">
                  <h3 className={`leading-tight ${hero ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>{f.name}</h3>
                                    {hero && (
                    <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">{f.children.slice(0, 6).map((c) => <span key={c.slug}>{c.name}</span>)}</p>
                  )}
                </div>
                <ArrowUpRight className="z-2 absolute bottom-6 right-6 h-5 w-5 text-faint transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-beni" />
                <span aria-hidden className="sheen pointer-events-none absolute inset-0 rounded-md" />
              </Link>
            </Tilt>
          );
        })}
      </div>
    </section>
  );
}
