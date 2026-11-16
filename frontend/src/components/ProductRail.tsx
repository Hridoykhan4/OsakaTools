"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// A row of products the visitor moves on purpose: swipe, trackpad, or the arrows.
// The page's vertical scroll is never taken over.
export default function ProductRail({ children, label }: { children: React.ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const step = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <div className="relative">
      <div className="absolute -top-14 right-0 hidden gap-2 sm:flex">
        <button type="button" onClick={() => step(-1)} aria-label={`Previous ${label}`} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white transition hover:border-beni hover:text-beni"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => step(1)} aria-label={`Next ${label}`} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white transition hover:border-beni hover:text-beni"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div ref={track} role="list" aria-label={label}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {children}
      </div>
    </div>
  );
}
