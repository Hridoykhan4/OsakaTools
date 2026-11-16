"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// One scoped motion layer for the editorial sections. Elements opt in with data attributes:
//   data-reveal       text block rises in once
//   data-wipe         image opens from the bottom edge (clip-path) once
//   data-parallax=n   drifts by n * 100px across its scroll range (scrub)
//   data-count=n      counts up to n once
//   data-needle       gauge needle sweeps with scroll (scrub)
// Native scrolling throughout: nothing is pinned and nothing hijacks the wheel.
export default function HomeMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set("[data-reveal]", { autoAlpha: 0, y: 36 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%", once: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }),
      });
      gsap.utils.toArray<HTMLElement>("[data-wipe]").forEach((el) => {
        gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut",
          scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        const img = el.querySelector("img");
        if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.fromTo(el, { y: Number(el.dataset.parallax) * 100 }, { y: Number(el.dataset.parallax) * -100, ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count || 0), obj = { v: 0 };
        gsap.to(obj, { v: end, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => { el.textContent = String(Math.round(obj.v)); } });
      });
      // SVG rotation is written as an attribute about the dial centre, which is exact in every browser.
      gsap.utils.toArray<SVGElement>("[data-needle]").forEach((el) => {
        const state = { a: -120 };
        el.setAttribute("transform", "rotate(-120 200 200)");
        gsap.to(state, { a: 104, ease: "none", onUpdate: () => el.setAttribute("transform", `rotate(${state.a.toFixed(2)} 200 200)`),
          scrollTrigger: { trigger: el.closest("article") || el, start: "top 85%", end: "bottom 25%", scrub: 0.6 } });
      });
    });
  }, { scope: root });

  return <div ref={root}>{children}</div>;
}
