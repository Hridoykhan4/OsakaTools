"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "./brand";

export interface ExplorerCategory {
  slug: string; name: string; icon?: string; tagline?: string; description?: string; productCount: number;
  children: { slug: string; name: string; tagline?: string; productCount: number }[];
}

export default function CategoryExplorer({ categories }: { categories: ExplorerCategory[] }) {
  const [active, setActive] = useState(0);
  const current = categories[active];
  if (!current) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <div role="tablist" aria-label="Product families" aria-orientation="vertical" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:col-span-5 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {categories.map((c, i) => (
          <button key={c.slug} role="tab" id={`tab-${c.slug}`} aria-selected={i === active} aria-controls="explorer-panel"
            onClick={() => setActive(i)} onMouseEnter={() => setActive(i)}
            className={`group flex shrink-0 items-center gap-4 rounded-full border px-4 py-3 text-left transition lg:rounded-none lg:border-x-0 lg:border-t-0 lg:px-0 lg:py-5 ${i === active ? "border-ink bg-ink text-paper lg:border-line lg:bg-transparent lg:text-ink" : "border-line text-ink-2 lg:border-line"}`}>
            <span className={`hidden font-mono text-xs lg:inline ${i === active ? "text-beni" : "text-faint"}`}>{String(i + 1).padStart(2, "0")}</span>
            <CategoryIcon name={c.icon} className={`h-5 w-5 shrink-0 ${i === active ? "text-beni" : ""}`} />
            <span className="whitespace-nowrap text-sm font-medium lg:flex-1 lg:whitespace-normal lg:text-xl lg:font-semibold lg:tracking-tight">{c.name}</span>
            <ArrowRight className={`hidden h-5 w-5 transition lg:block ${i === active ? "translate-x-0 text-beni opacity-100" : "-translate-x-2 opacity-0"}`} />
          </button>
        ))}
      </div>
      <div id="explorer-panel" role="tabpanel" aria-labelledby={`tab-${current.slug}`} className="card relative overflow-hidden p-6 sm:p-10 lg:col-span-7">
        <CategoryIcon name={current.icon} aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 text-ink/[0.04]" />
        <p className="eyebrow">{current.productCount ? `${current.productCount} products listed` : "Specified sourcing"}</p>
        <h3 className="mt-4 text-3xl font-semibold sm:text-4xl">{current.name}</h3>
        <p className="mt-4 max-w-xl text-mute">{current.description || current.tagline}</p>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {current.children.map((child) => (
            <li key={child.slug} className="bg-white">
              <Link href={`/categories/${child.slug}`} className="group flex h-full items-start justify-between gap-4 p-5 transition hover:bg-paper">
                <span>
                  <span className="block font-medium">{child.name}</span>
                  {child.tagline && <span className="mt-1 block text-sm text-mute">{child.tagline}</span>}
                </span>
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-faint transition group-hover:text-beni" />
              </Link>
            </li>
          ))}
        </ul>
        <Link href={`/categories/${current.slug}`} className="btn btn-primary mt-8">Explore {current.name}<ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}
