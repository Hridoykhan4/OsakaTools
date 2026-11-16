"use client";

import { useEffect, useRef } from "react";

// Pointer-driven 3D tilt. Writes CSS variables directly (no React re-render per move);
// children opt into depth with the z-1 / z-2 / z-3 classes. Mouse only.
// trackParent listens on the parent element, for cards whose link overlay covers the tilt surface.
export default function Tilt({ children, className = "", max = 9, trackParent = false }: { children: React.ReactNode; className?: string; max?: number; trackParent?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const target = trackParent ? el?.parentElement : el;
    if (!el || !target) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      el.style.setProperty("--ry", `${(x - 0.5) * max * 2}deg`);
      el.style.setProperty("--rx", `${(0.5 - y) * max * 2}deg`);
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.classList.add("is-active");
    };
    const leave = () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); el.classList.remove("is-active"); };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerleave", leave);
    return () => { target.removeEventListener("pointermove", move); target.removeEventListener("pointerleave", leave); };
  }, [max, trackParent]);
  return <div ref={ref} className={`tilt ${className}`}>{children}</div>;
}
