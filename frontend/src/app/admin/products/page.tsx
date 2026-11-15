"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Plus, Search, Star } from "lucide-react";
import { admin, qs } from "@/lib/adminApi";
import type { Category, Pagination, Product } from "@/lib/types";
import { Badge, PageHeader, StateView, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "@/components/admin/kit";

const STATUSES = ["", "draft", "review", "published", "archived"];

export default function AdminProducts() {
  const { can } = useSession();
  const [filters, setFilters] = useState({ status: "", category: "", q: "", page: 1 });
  const [selected, setSelected] = useState<string[]>([]);
  const { run, busy } = useAction();
  const cats = useLoad(() => admin.get<{ categories: Category[] }>("/categories"));
  const { data, error, loading, reload } = useLoad(
    () => admin.get<{ products: Product[]; pagination: Pagination }>(`/products${qs({ ...filters, limit: 50 })}`), [filters]);

  const products = data?.products || [];
  const allOn = products.length > 0 && products.every((p) => selected.includes(p._id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function bulk(action: string, extra: Record<string, unknown> = {}) {
    if (action === "delete" && !confirm(`Delete ${selected.length} products permanently?`)) return;
    const r = await run(() => admin.post<{ updated: number; failed: { name: string; message: string }[] }>("/products/bulk", { ids: selected, action, ...extra }));
    if (r) {
      if (r.failed.length) alert(`${r.updated} updated. ${r.failed.length} failed:\n\n${r.failed.map((f) => `• ${f.name}: ${f.message}`).join("\n")}`);
      setSelected([]); reload();
    }
  }

  return (
    <>
      <PageHeader title="Products" subtitle={`${data?.pagination.total ?? "…"} products in the catalogue`}
        actions={can("catalog:write") && <Link href="/admin/products/new" className={btnPrimary}><Plus className="h-4 w-4" />New product</Link>} />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-paper px-3">
          <Search className="h-4 w-4 text-faint" />
          <input placeholder="Search name, model, SKU, manufacturer" defaultValue={filters.q} aria-label="Search products"
            onKeyDown={(e) => e.key === "Enter" && setFilters((f) => ({ ...f, q: (e.target as HTMLInputElement).value, page: 1 }))}
            className="h-10 flex-1 bg-transparent text-sm outline-none" />
        </div>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} className="field !min-h-10 lg:w-40" aria-label="Status">
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))} className="field !min-h-10 lg:w-56" aria-label="Category">
          <option value="">All categories</option>
          {cats.data?.categories.map((c) => <option key={c._id} value={c.slug}>{c.parent ? "— " : ""}{c.name}</option>)}
        </select>
      </div>

      {selected.length > 0 && can("catalog:write") && (
        <div className="sticky top-14 z-30 mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-ink p-3 text-sm text-paper lg:top-2">
          <span className="px-2 font-mono">{selected.length} selected</span>
          {can("catalog:publish") && <button disabled={busy} onClick={() => bulk("publish")} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">Publish</button>}
          <button disabled={busy} onClick={() => bulk("review")} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">Send to review</button>
          <button disabled={busy} onClick={() => bulk("draft")} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">Unpublish to draft</button>
          <button disabled={busy} onClick={() => bulk("feature")} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">Feature</button>
          <button disabled={busy} onClick={() => bulk("unfeature")} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">Unfeature</button>
          <button disabled={busy} onClick={() => bulk("archive")} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">Archive</button>
          <select aria-label="Move to category" className="rounded-full bg-white/10 px-3 py-1.5" value="" onChange={(e) => e.target.value && bulk("category", { category: e.target.value })}>
            <option value="">Move to category…</option>
            {cats.data?.categories.map((c) => <option key={c._id} value={c._id} className="text-ink">{c.name}</option>)}
          </select>
          {can("catalog:delete") && <button disabled={busy} onClick={() => bulk("delete")} className="rounded-full bg-beni px-3 py-1.5">Delete</button>}
          <button onClick={() => setSelected([])} className="ml-auto px-2 text-silver hover:text-white">Clear</button>
        </div>
      )}

      <StateView loading={loading} error={error} empty={!products.length}>
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="hidden grid-cols-[2rem_3.5rem_1fr_10rem_8rem_9rem] items-center gap-4 border-b border-line px-4 py-2.5 font-mono text-[0.65rem] uppercase tracking-wide text-faint md:grid">
            <input type="checkbox" checked={allOn} onChange={() => setSelected(allOn ? [] : products.map((p) => p._id))} aria-label="Select all" />
            <span /><span>Product</span><span>Category</span><span>Status</span><span>Updated</span>
          </div>
          <ul className="divide-y divide-line-2">
            {products.map((p) => (
              <li key={p._id} className="grid grid-cols-[2rem_3.5rem_1fr] items-center gap-x-4 gap-y-1 px-4 py-3 md:grid-cols-[2rem_3.5rem_1fr_10rem_8rem_9rem]">
                <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggle(p._id)} aria-label={`Select ${p.name}`} />
                <span className="relative h-12 w-12 overflow-hidden rounded-lg bg-paper">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-contain p-1" />}</span>
                <div className="min-w-0">
                  <Link href={`/admin/products/${p._id}`} className="flex items-center gap-1.5 font-medium hover:text-beni">
                    {p.featured && <Star className="h-3.5 w-3.5 fill-beni text-beni" aria-label="Featured" />}<span className="truncate">{p.name}</span>
                  </Link>
                  <p className="truncate font-mono text-xs text-mute">{[p.manufacturer, p.modelNumber, p.sku].filter(Boolean).join(" · ")}{p.source?.system && p.source.system !== "manual" ? ` · via ${p.source.system}` : ""}</p>
                </div>
                <span className="col-start-3 truncate text-sm text-mute md:col-start-auto">{typeof p.category === "object" ? p.category.name : ""}</span>
                <span className="col-start-3 flex items-center gap-2 md:col-start-auto"><Badge value={p.status} />
                  {p.status === "published" && <a href={`/products/${p.slug}`} target="_blank" aria-label="View on site" className="text-faint hover:text-ink"><ExternalLink className="h-3.5 w-3.5" /></a>}</span>
                <span className="col-start-3 font-mono text-xs text-faint md:col-start-auto">{fmtDate(p.updatedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
        {data && data.pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button className={btnGhost} disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
            <span className="font-mono text-sm">{filters.page} / {data.pagination.pages}</span>
            <button className={btnGhost} disabled={filters.page >= data.pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
          </div>
        )}
      </StateView>
    </>
  );
}
