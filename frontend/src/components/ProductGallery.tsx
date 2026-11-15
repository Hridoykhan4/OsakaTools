"use client";

import Image from "next/image";
import { useState } from "react";
import type { Image as Img } from "@/lib/types";

export default function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div>
      <div className="card grid-paper relative aspect-square overflow-hidden">
        {current ? (
          <Image key={current.url} src={current.url} alt={current.alt || name} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain p-8 sm:p-14" />
        ) : <div className="grid h-full place-items-center font-mono text-sm text-faint">Image pending</div>}
        <span className="absolute bottom-4 left-4 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">Fig. {String(active + 1).padStart(2, "0")}</span>
      </div>
      {images.length > 1 && (
        <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button key={img.url} role="tab" aria-selected={i === active} aria-label={`Image ${i + 1}`} onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white ${i === active ? "border-ink" : "border-line"}`}>
              <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
