"use client";

import { useRef } from "react";
import { gsap } from "gsap";

// Pulls its child slightly toward the pointer on fine-pointer devices.
export default function Magnetic({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    gsap.to(ref.current, { x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength, duration: 0.5, ease: "power3.out" });
  };
  const leave = () => ref.current && gsap.to(ref.current, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
  return <span ref={ref} onPointerMove={move} onPointerLeave={leave} className="inline-block">{children}</span>;
}
