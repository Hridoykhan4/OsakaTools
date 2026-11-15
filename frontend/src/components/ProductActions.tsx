"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ClipboardList, GitCompareArrows, Minus, Plus, X } from "lucide-react";
import { COMPARE_LIMIT, useCompare, useRfq, type RfqLine } from "@/lib/client-store";

type Item = Omit<RfqLine, "quantity">;

export function ProductQuickActions({ product }: { product: Item }) {
  const rfq = useRfq();
  const compare = useCompare();
  const inRfq = rfq.has(product.id);
  const inCompare = compare.has(product.slug);
  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 opacity-100 transition md:translate-x-2 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 md:focus-within:translate-x-0 md:focus-within:opacity-100">
      <button onClick={() => (inRfq ? rfq.remove(product.id) : rfq.add(product))} aria-pressed={inRfq}
        aria-label={inRfq ? `Remove ${product.name} from quote` : `Add ${product.name} to quote`}
        className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition ${inRfq ? "border-beni bg-beni text-white" : "border-line bg-white/90 hover:border-ink"}`}>
        {inRfq ? <Check className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
      </button>
      <button onClick={() => compare.toggle({ slug: product.slug, name: product.name })} aria-pressed={inCompare}
        aria-label={inCompare ? `Remove ${product.name} from comparison` : `Compare ${product.name}`}
        className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition ${inCompare ? "border-ai bg-ai text-white" : "border-line bg-white/90 hover:border-ink"}`}>
        <GitCompareArrows className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductBuyBox({ product, moq = 1 }: { product: Item; moq?: number }) {
  const rfq = useRfq();
  const compare = useCompare();
  const [qty, setQty] = useState(Math.max(1, moq));
  const inRfq = rfq.has(product.id);
  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-full border border-line bg-white">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
          <input value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))} inputMode="numeric" aria-label="Quantity"
            className="w-14 bg-transparent text-center font-mono outline-none" />
          <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
        </div>
        {inRfq
          ? <Link href="/rfq" className="btn btn-primary flex-1"><Check className="h-4 w-4" /> In your quote — review</Link>
          : <button onClick={() => rfq.add(product, qty)} className="btn btn-red flex-1"><ClipboardList className="h-4 w-4" /> Add to quote request</button>}
      </div>
      <button onClick={() => compare.toggle({ slug: product.slug, name: product.name })} className="btn btn-ghost w-full">
        <GitCompareArrows className="h-4 w-4" /> {compare.has(product.slug) ? "Remove from comparison" : "Add to comparison"}
      </button>
    </div>
  );
}

export function CompareBar() {
  const { items, toggle, clear } = useCompare();
  if (items.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-full border border-line bg-ink/95 p-2 pl-5 text-paper shadow-2xl backdrop-blur">
        <GitCompareArrows className="h-4 w-4 shrink-0 text-silver" />
        <div className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {items.map((i) => (
            <span key={i.slug} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 py-1 pl-3 pr-1.5 text-xs">
              <span className="max-w-[9rem] truncate">{i.name}</span>
              <button onClick={() => toggle(i)} aria-label={`Remove ${i.name}`} className="rounded-full p-0.5 hover:bg-white/20"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <span className="hidden font-mono text-xs text-silver sm:inline">{items.length}/{COMPARE_LIMIT}</span>
        <button onClick={clear} className="hidden text-xs text-silver hover:text-white sm:inline">Clear</button>
        <Link href={`/compare?p=${items.map((i) => i.slug).join(",")}`} className="btn btn-red !min-h-9 !py-1.5 text-sm">Compare</Link>
      </div>
    </div>
  );
}
