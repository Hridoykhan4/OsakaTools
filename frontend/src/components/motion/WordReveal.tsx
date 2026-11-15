"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// A statement whose words ink in as it scrolls through the viewport.
export default function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const root = useRef<HTMLParagraphElement>(null);
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo("[data-word]", { opacity: 0.14 }, { opacity: 1, stagger: 0.08, ease: "none",
        scrollTrigger: { trigger: root.current, start: "top 80%", end: "bottom 45%", scrub: true } });
    });
  }, { scope: root });
  return (
    <p ref={root} className={className}>
      {text.split(" ").map((w, i) => <span key={i} data-word className="inline-block pr-[0.25em]">{w}</span>)}
    </p>
  );
}
