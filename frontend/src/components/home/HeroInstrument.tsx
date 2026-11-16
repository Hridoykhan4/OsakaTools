"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface HeroPart { slug: string; label: string; name: string; image: string; x: number; y: number; w: number; depth: number }

// The hero is an engineering drawing: real products are the parts, each called out
// with a numbered balloon, and the parts list doubles as navigation.
const CORNERS = ["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"];

export default function HeroInstrument({ parts, title, subtitle }: { parts: HeroPart[]; title: string; subtitle: string }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const words = title.split(" ");
  const lineA = words.slice(0, 1).join(" ");
  const lineB = words.slice(1).join(" ");

  useGSAP((_, contextSafe) => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo("[data-grid]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "power2.out" })
        .fromTo("[data-tick]", { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8, stagger: 0.05 }, 0.1)
        .fromTo("[data-line]", { yPercent: 108, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.3, stagger: 0.12 }, 0.2)
        .fromTo("[data-part]", { autoAlpha: 0, y: 60, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.4, stagger: 0.09 }, 0.35)
        .fromTo("[data-balloon]", { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.06, ease: "back.out(2)" }, 1)
        .fromTo("[data-leader]", { scaleX: 0, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: "power3.out" }, 1.05)
        .fromTo("[data-fade]", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07 }, 0.8);

      // Depth: parts drift apart at different rates as the page scrolls away.
      gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
        gsap.to(el, { yPercent: -60 * Number(el.dataset.depth), ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      });
    });

    // Pointer parallax and a live coordinate readout (fine pointers only).
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const movers = gsap.utils.toArray<HTMLElement>("[data-depth]").map((el) => ({
        d: Number(el.dataset.depth),
        x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
      }));
      const rx = root.current!.querySelector<HTMLElement>("[data-rx]");
      const ry = root.current!.querySelector<HTMLElement>("[data-ry]");
      const move = contextSafe!((e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        movers.forEach((m) => { m.x(nx * -40 * m.d); m.y(ny * -28 * m.d); });
        if (rx && ry) { rx.textContent = (e.clientX * 0.2646).toFixed(1).padStart(6, "0"); ry.textContent = (e.clientY * 0.2646).toFixed(1).padStart(6, "0"); }
      });
      window.addEventListener("pointermove", move, { passive: true });
      return () => window.removeEventListener("pointermove", move);
    });
  }, { scope: root });

  return (
    <section ref={root} className="relative overflow-hidden bg-white">
      <div data-grid data-intro className="grid-paper pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_62%_42%,black_15%,transparent_72%)]" aria-hidden />

      <div className="shell relative flex min-h-[calc(100svh-4.5rem)] flex-col pb-8 pt-6">
        {/* Drawing frame: registration ticks and title-block readouts */}
        <div aria-hidden className="pointer-events-none absolute inset-x-5 bottom-6 top-4 hidden sm:block lg:inset-x-12">
          {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((c) => (
            <span key={c} data-tick data-intro className={`absolute h-4 w-4 border-ink/60 ${c}`} />
          ))}
        </div>
        <div data-fade data-intro className="readout relative flex justify-between text-faint">
          <span>DWG. OT-001 — Engineered supply</span>
          <span className="hidden sm:inline">X <span data-rx>000.0</span>  Y <span data-ry>000.0</span> mm</span>
        </div>

        <div className="relative mt-4 grid flex-1 grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Parts stage */}
          <div className="relative aspect-[1/0.95] w-full sm:aspect-[16/11] lg:col-span-8 lg:aspect-auto lg:min-h-[clamp(24rem,56vh,42rem)]">
            {parts.map((p, i) => (
              <div key={p.slug} data-part data-intro className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, transform: "translate(-50%, -50%)" }}>
                <div data-depth={p.depth}>
                  <Link href={`/products/${p.slug}`} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
                    className={`group relative block aspect-square transition-opacity duration-500 ${active !== null && active !== i ? "opacity-25" : "opacity-100"}`} aria-label={p.name}>
                    <Image src={p.image} alt="" fill priority={i < 2} sizes="(min-width:1024px) 22vw, 40vw" className="object-contain drop-shadow-[0_24px_24px_rgba(21,23,26,0.12)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
                    <span aria-hidden className={`pointer-events-none absolute -inset-3 transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-0"}`}>
                      {CORNERS.map((c) => <span key={c} className={`absolute h-3 w-3 border-beni ${c}`} />)}
                    </span>
                    <span aria-hidden className="absolute left-[10%] top-[10%] hidden sm:block">
                      <span data-leader data-intro className={`absolute left-[-34px] top-[-26px] block h-px w-[43px] origin-left rotate-[37deg] transition-colors ${active === i ? "bg-beni" : "bg-ink/45"}`} />
                      <span data-balloon data-intro className={`readout absolute left-[-48px] top-[-40px] grid h-7 w-7 place-items-center rounded-full border bg-white transition-colors ${active === i ? "border-beni text-beni" : "border-ink/50 text-ink"}`}>{i + 1}</span>
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Brief + parts list */}
          <div className="flex flex-col justify-end lg:col-span-4">
            <p data-fade data-intro className="max-w-sm text-lg leading-snug text-ink-2">{subtitle}</p>
            <ol data-fade data-intro className="mt-6 border-t border-line" aria-label="Parts shown">
              {parts.map((p, i) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
                    className={`flex items-center gap-4 border-b border-line py-2.5 text-sm transition-colors ${active === i ? "text-beni" : "text-ink-2"}`}>
                    <span className="readout w-4 text-faint">{i + 1}</span>
                    <span className="flex-1">{p.label}</span>
                    <ArrowRight className={`h-3.5 w-3.5 transition ${active === i ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"}`} />
                  </Link>
                </li>
              ))}
            </ol>
            <div data-fade data-intro className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-primary">Explore the catalogue <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/rfq" className="btn btn-ghost">Request a quote</Link>
            </div>
          </div>
        </div>

        <h1 className="display relative mt-10 text-[clamp(3.2rem,8.6vw,10rem)] lg:mt-6 lg:flex lg:gap-[0.24em] lg:whitespace-nowrap">
          <span className="block overflow-hidden pb-[0.08em]"><span data-line data-intro className="block">{lineA}</span></span>
          <span className="block overflow-hidden pb-[0.08em]"><span data-line data-intro className="block text-silver">{lineB}</span></span>
        </h1>
      </div>
    </section>
  );
}
