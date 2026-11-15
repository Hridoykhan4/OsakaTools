"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import type { Product } from "@/lib/types";

// Product, model number and SKU search across the published catalogue.
export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [found, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);

  // The palette is mounted only while open, so its state starts fresh each time.
  useEffect(() => { const t = setTimeout(() => input.current?.focus(), 30); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q.trim())}&limit=8`, { signal: ctrl.signal });
        if (res.ok) { setResults((await res.json()).products || []); setCursor(0); }
      } catch { /* aborted or offline */ } finally { setLoading(false); }
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  if (!open) return null;
  const results = q.trim().length >= 2 ? found : [];

  const go = (href: string) => { onClose(); router.push(href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (results[cursor]) go(`/products/${results[cursor].slug}`);
      else if (q.trim()) go(`/products?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-paper/70 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search products">
      <div className="w-full max-w-2xl overflow-hidden rounded-sm border border-line bg-paper shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="h-5 w-5 text-faint" />
          <input
            ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search by product, model number or SKU" aria-label="Search"
            className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-faint"
          />
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-paper-2" aria-label="Close search"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2" role="listbox">
          {q.trim().length < 2 && <p className="px-4 py-8 text-center text-sm text-mute">Type at least two characters. Try a model number such as <span className="font-mono">ES480</span>.</p>}
          {q.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-mute">
              No published product matches “{q}”.
              <Link href={`/rfq?need=${encodeURIComponent(q)}`} onClick={onClose} className="mt-3 flex items-center justify-center gap-1 font-medium text-beni">Ask our sourcing desk <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
          {results.map((p, i) => (
            <button key={p._id} role="option" aria-selected={i === cursor} onMouseEnter={() => setCursor(i)} onClick={() => go(`/products/${p.slug}`)}
              className={`flex w-full items-center gap-4 rounded-xl p-2.5 text-left ${i === cursor ? "bg-paper-2" : ""}`}>
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-contain p-1" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block truncate font-mono text-xs text-mute">{[p.manufacturer, p.modelNumber, p.sku].filter(Boolean).join(" · ")}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-faint" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
