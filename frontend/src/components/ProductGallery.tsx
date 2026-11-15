"use client";

import Image from "next/image";
import { useState } from "react";
import type { Image as Img } from "@/lib/types";

export default function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-sm border border-line bg-paper-2">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        {current ? (
          <Image key={current.url} src={current.url} alt={current.alt || name} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain p-8 mix-blend-multiply sm:p-14" />
        ) : <div className="grid h-full place-items-center font-mono text-sm text-faint">Image pending</div>}
        <span className="absolute bottom-4 left-4 font-mincho text-xs text-faint">Fig. {String(active + 1).padStart(2, "0")}</span>
      </div>
      {images.length > 1 && (
        <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button key={img.url} role="tab" aria-selected={i === active} aria-label={`Image ${i + 1}`} onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border bg-white ${i === active ? "border-beni" : "border-line"}`}>
              <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
