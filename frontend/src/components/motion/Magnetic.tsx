"use client";

import { useRef } from "react";

// Pulls its child slightly toward the pointer on mouse devices.
export default function Magnetic({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (e.pointerType !== "mouse" || !el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength}px)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ""; };
  return <span ref={ref} onPointerMove={move} onPointerLeave={leave} className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)]">{children}</span>;
}
