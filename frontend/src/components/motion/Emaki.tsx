"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface EmakiFamily {
  slug: string; name: string; kanji: string; tagline?: string; count: number;
  children: { slug: string; name: string }[]; images: { url: string; alt: string }[];
}

// Emaki (picture scroll): product families unroll horizontally while the page scrolls
// vertically. On small screens and with reduced motion it is a native swipe row.
export default function Emaki({ families }: { families: EmakiFamily[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const el = track.current!;
      const distance = () => el.scrollWidth - window.innerWidth;
      const tween = gsap.to(el, { x: () => -distance(), ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: 0.9, pin: true, invalidateOnRefresh: true, anticipatePin: 1 } });
      gsap.to("[data-progress]", { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true } });
      gsap.utils.toArray<HTMLElement>("[data-panel-kanji]").forEach((k) => {
        gsap.fromTo(k, { yPercent: 18 }, { yPercent: -18, ease: "none", scrollTrigger: { trigger: k, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
    });
  }, { scope: root });

  return (
    <section ref={root} id="families" className="relative overflow-hidden border-y border-line bg-paper-2 lg:h-screen">
      <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-beni lg:h-[3px]" data-progress />
      <div ref={track} className="scrollbar-none flex h-full snap-x snap-mandatory items-stretch gap-0 overflow-x-auto lg:snap-none lg:overflow-visible">
        <div className="flex w-[85vw] shrink-0 snap-start flex-col justify-center px-6 py-16 sm:w-[60vw] lg:w-[34vw] lg:px-12">
          <p className="eyebrow">Product families</p>
          <h2 className="mt-5 text-4xl leading-[1.05] sm:text-6xl">Every discipline, one standard.</h2>
          <p className="mt-6 max-w-sm text-mute">From the electrician’s multimeter to the sprinkler valve on a high-rise riser, every family is organised by the task it measures or protects.</p>
          <p className="mt-10 hidden text-sm text-faint lg:block">Scroll to unroll</p>
        </div>
        {families.map((f, i) => (
          <article key={f.slug} className="group relative flex w-[85vw] shrink-0 snap-start flex-col border-l border-line px-6 py-12 sm:w-[60vw] lg:w-[46vw] lg:px-12 lg:py-16">
            <span data-panel-kanji aria-hidden className="pointer-events-none absolute right-4 top-6 select-none font-mincho text-[9rem] font-extrabold leading-none text-beni/[0.09] lg:text-[17rem]">{f.kanji}</span>
            <div className="relative flex items-baseline justify-between">
              <span className="font-mincho text-lg text-beni">{["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"][i] || i + 1}</span>
              <span className="text-sm text-mute">{f.count ? `${f.count} ${f.count === 1 ? "product" : "products"}` : "Sourcing on request"}</span>
            </div>
            <div className="relative mt-8 grid flex-1 grid-cols-3 gap-2">
              {f.images.slice(0, 3).map((img, j) => (
                <div key={img.url} className={`relative overflow-hidden rounded-sm bg-white ${j === 0 ? "col-span-2 row-span-2 min-h-56" : "min-h-24"}`}>
                  <Image src={img.url} alt={img.alt} fill sizes="(min-width:1024px) 22vw, 50vw" className="object-contain p-4 transition duration-700 group-hover:scale-105" />
                </div>
              ))}
              {f.images.length === 0 && (
                <div className="asanoha col-span-3 grid min-h-56 place-items-center rounded-sm border border-dashed border-line bg-white/60">
                  <span className="font-mincho text-7xl text-ink/80">{f.kanji}</span>
                </div>
              )}
            </div>
            <div className="relative mt-8">
              <h3 className="text-3xl leading-tight lg:text-4xl">
                <Link href={`/categories/${f.slug}`} className="after:absolute after:inset-0">{f.name}</Link>
              </h3>
              {f.tagline && <p className="mt-3 max-w-md text-mute">{f.tagline}</p>}
              <ul className="relative z-10 mt-5 flex flex-wrap gap-2">
                {f.children.slice(0, 6).map((c) => (
                  <li key={c.slug}><Link href={`/categories/${c.slug}`} className="inline-block rounded-full border border-line bg-white px-3 py-1 text-xs transition hover:border-beni hover:text-beni">{c.name}</Link></li>
                ))}
              </ul>
              <ArrowUpRight className="absolute bottom-0 right-0 h-6 w-6 text-faint transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-beni" />
            </div>
          </article>
        ))}
        <div className="w-6 shrink-0 lg:w-[8vw]" />
      </div>
    </section>
  );
}
