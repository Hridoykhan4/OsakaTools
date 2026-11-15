"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Lenis inertial scrolling driven by GSAP's ticker so ScrollTrigger stays in sync.
// Skipped entirely for reduced-motion users and on coarse pointers (native touch scroll is better).
export default function SmoothScroll() {
  const pathname = usePathname();
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Anchor links scroll smoothly too.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute("href") || "");
      if (target) { e.preventDefault(); lenis.scrollTo(target as HTMLElement, { offset: -80 }); }
    };
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
  useEffect(() => { const id = setTimeout(() => ScrollTrigger.refresh(), 200); return () => clearTimeout(id); }, [pathname]);
  return null;
}
