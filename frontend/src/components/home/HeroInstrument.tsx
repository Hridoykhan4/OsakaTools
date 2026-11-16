"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

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

  // Pointer parallax and the live coordinate readout. Plain CSS variables, written at most
  // once per frame; the browser eases them with a transition. Fine pointers only.
  useEffect(() => {
    const el = root.current;
    if (!el || !matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const rx = el.querySelector<HTMLElement>("[data-rx]"), ry = el.querySelector<HTMLElement>("[data-ry]");
    let frame = 0, x = 0, y = 0;
    const paint = () => {
      frame = 0;
      el.style.setProperty("--mx", (x / innerWidth - 0.5).toFixed(3));
      el.style.setProperty("--my", (y / innerHeight - 0.5).toFixed(3));
      if (rx && ry) { rx.textContent = (x * 0.2646).toFixed(1).padStart(6, "0"); ry.textContent = (y * 0.2646).toFixed(1).padStart(6, "0"); }
    };
    const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; if (!frame) frame = requestAnimationFrame(paint); };
    addEventListener("pointermove", move, { passive: true });
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(frame); };
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-white">
      <div className="fade grid-paper pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_62%_42%,black_15%,transparent_72%)]" aria-hidden />

      <div className="shell relative flex min-h-[calc(100svh-4.5rem)] flex-col pb-8 pt-6">
        {/* Drawing frame: registration ticks and title-block readouts */}
        <div aria-hidden className="pointer-events-none absolute inset-x-5 bottom-6 top-4 hidden sm:block lg:inset-x-12">
          {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((c) => (
            <span key={c} className={`pop absolute h-4 w-4 border-ink/60 ${c}`} style={{ animationDelay: "0.2s" }} />
          ))}
        </div>
        <div className="intro-fade readout relative flex justify-between text-faint" style={{ animationDelay: "0.05s" }}>
          <span>DWG. OT-001 — Engineered supply</span>
          <span className="hidden sm:inline">X <span data-rx>000.0</span>  Y <span data-ry>000.0</span> mm</span>
        </div>

        <div className="relative mt-4 grid flex-1 grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Parts stage */}
          <div className="relative aspect-[1/0.95] w-full sm:aspect-[16/11] lg:col-span-8 lg:aspect-auto lg:min-h-[clamp(24rem,56vh,42rem)]">
            {parts.map((p, i) => (
              <div key={p.slug} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, transform: "translate(-50%, -50%)" }}>
                <div className="part-in" style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
                <div data-depth style={{ "--d": p.depth } as React.CSSProperties}>
                <div className="parallax" style={{ "--d": p.depth } as React.CSSProperties}>
                  <Link href={`/products/${p.slug}`} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
                    className={`group relative block aspect-square transition-opacity duration-500 ${active !== null && active !== i ? "opacity-25" : "opacity-100"}`} aria-label={p.name}>
                    <Image src={p.image} alt="" fill priority={i < 2} sizes={`(min-width:1024px) ${Math.round(p.w * 0.62)}vw, ${Math.round(p.w)}vw`} className="object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
                    <span aria-hidden className={`pointer-events-none absolute -inset-3 transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-0"}`}>
                      {CORNERS.map((c) => <span key={c} className={`absolute h-3 w-3 border-beni ${c}`} />)}
                    </span>
                    <span aria-hidden className="absolute left-[10%] top-[10%] hidden sm:block">
                      <span className="absolute left-[-34px] top-[-26px] block w-[43px] origin-left rotate-[37deg]"><span className={`draw-x block h-px w-full transition-colors ${active === i ? "bg-beni" : "bg-ink/45"}`} style={{ animationDelay: `${0.9 + i * 0.07}s` }} /></span>
                      <span className={`pop readout absolute left-[-48px] top-[-40px] grid h-7 w-7 place-items-center rounded-full border bg-white transition-colors ${active === i ? "border-beni text-beni" : "border-ink/50 text-ink"}`} style={{ animationDelay: `${0.85 + i * 0.07}s` }}>{i + 1}</span>
                    </span>
                  </Link>
                </div>
                </div>
                </div>
              </div>
            ))}
          </div>

          {/* Brief + parts list */}
          <div className="flex flex-col justify-end lg:col-span-4">
            <p className="intro-fade max-w-sm text-lg leading-snug text-ink-2" style={{ animationDelay: "0.5s" }}>{subtitle}</p>
            <ol className="intro-fade mt-6 border-t border-line" style={{ animationDelay: "0.6s" }} aria-label="Parts shown">
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
            <div className="intro-fade mt-6 flex flex-wrap gap-3" style={{ animationDelay: "0.7s" }}>
              <Link href="/products" className="btn btn-primary">Explore the catalogue <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/rfq" className="btn btn-ghost">Request a quote</Link>
            </div>
          </div>
        </div>

        <h1 className="display relative mt-10 text-[clamp(3.2rem,8.6vw,10rem)] lg:mt-6 lg:flex lg:gap-[0.24em] lg:whitespace-nowrap">
          <span className="block overflow-hidden pb-[0.08em]"><span className="rise block" style={{ animationDelay: "0.1s" }}>{lineA}</span></span>
          <span className="block overflow-hidden pb-[0.08em]"><span className="rise block text-silver" style={{ animationDelay: "0.22s" }}>{lineB}</span></span>
        </h1>
      </div>
    </section>
  );
}
