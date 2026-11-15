"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDownRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface HeroProps {
  kicker: string; title: string; subtitle: string; kanji: string;
  stats: { value: number; label: string }[];
}

// The signature moment: a hinomaru sun rises over a precision horizon while the
// headline is set character by character; on scroll the sun sinks below the horizon.
export default function HeroSun({ kicker, title, subtitle, kanji, stats }: HeroProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-horizon]", { scaleX: 0, duration: 1.6, ease: "expo.inOut" })
        .from("[data-sun]", { yPercent: 70, scale: 0.6, duration: 1.8 }, 0.25)
        .from("[data-char]", { yPercent: 115, duration: 1.1, stagger: 0.022 }, 0.55)
        .from("[data-kanji] span", { opacity: 0, y: -24, filter: "blur(6px)", duration: 1.2, stagger: 0.14 }, 0.8)
        .from("[data-fade]", { opacity: 0, y: 16, duration: 1, stagger: 0.08 }, 1.1);

      gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 } })
        .to("[data-sun]", { yPercent: 62, scale: 1.12, ease: "none" }, 0)
        .to("[data-title]", { yPercent: -18, opacity: 0.15, ease: "none" }, 0)
        .to("[data-kanji]", { yPercent: 25, ease: "none" }, 0);

      // Count up the figures once they are on screen.
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count || 0);
        const obj = { v: 0 };
        gsap.to(obj, { v: end, duration: 2, ease: "power3.out", delay: 1.4, onUpdate: () => { el.textContent = String(Math.round(obj.v)); } });
      });
    });
  }, { scope: root });

  const words = title.split(" ");
  return (
    <section ref={root} className="relative overflow-hidden">
      <div className="shell relative grid min-h-[calc(100svh-4.5rem)] grid-cols-12 items-end gap-6 pb-10 pt-8 lg:pb-14">
        {/* Sun and horizon */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[6%] bottom-[26%] hidden overflow-hidden lg:block">
          <div data-sun className="absolute left-[62%] top-[12%] aspect-square w-[38vw] max-w-[40rem] -translate-x-1/2 rounded-full bg-beni" />
        </div>
        <div aria-hidden data-horizon className="pointer-events-none absolute inset-x-12 bottom-[26%] hidden h-px origin-left bg-ink lg:block" />

        <div data-kanji aria-hidden className="vertical pointer-events-none absolute right-4 top-6 flex select-none font-mincho text-[2.8rem] font-extrabold leading-[1.05] text-ink sm:text-7xl lg:right-12 lg:top-10 lg:text-[6.5rem]">
          {[...kanji].map((c, i) => <span key={i} className="inline-block">{c}</span>)}
        </div>

        <div className="relative col-span-12 lg:col-span-9">
          {/* Small screens: the sun rises in its own band, cut by the horizon, above the headline. */}
          <div aria-hidden className="relative mb-8 h-[42vw] max-h-72 overflow-hidden border-b border-ink lg:hidden">
            <div data-sun className="absolute bottom-[-30vw] left-[8%] aspect-square w-[62vw] max-w-sm rounded-full bg-beni" />
          </div>
          <p data-fade className="eyebrow">{kicker}</p>
          <h1 data-title className="display mt-5 text-[3rem] leading-[0.98] sm:text-7xl lg:text-[7.4rem]">
            <span className="sr-only">{title}</span>
            <span aria-hidden>
              {words.map((w, wi) => (
                <span key={wi} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                  {[...w].map((c, ci) => <span key={ci} data-char className="inline-block">{c}</span>)}
                </span>
              ))}
            </span>
          </h1>
        </div>

        <div className="relative col-span-12 mt-4 grid gap-8 border-t border-line pt-6 lg:mt-8 lg:grid-cols-12">
          <p data-fade className="max-w-xl text-lg leading-relaxed text-ink-2 lg:col-span-5">{subtitle}</p>
          <dl data-fade className="grid grid-cols-3 gap-4 lg:col-span-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-mute">{s.label}</dt>
                <dd className="mt-1 font-mincho text-4xl font-semibold tabular-nums"><span data-count={s.value}>{s.value}</span></dd>
              </div>
            ))}
          </dl>
          <div data-fade className="flex flex-wrap items-end gap-3 lg:col-span-3 lg:justify-end">
            <Link href="/products" className="btn btn-primary">Explore the catalogue</Link>
            <Link href="#families" className="btn btn-ghost" aria-label="Scroll to product families"><ArrowDownRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
