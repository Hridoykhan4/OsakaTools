"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, Menu, Search, X } from "lucide-react";
import { CategoryIcon, Logo } from "./brand";
import SearchPalette from "./SearchPalette";
import { NAV } from "@/lib/site";
import { useRfq } from "@/lib/client-store";

export interface NavCategory { slug: string; name: string; icon?: string; tagline?: string; children: { slug: string; name: string }[] }

export default function Header({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items } = useRfq();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setOpen(false); setMega(false); }
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); }
      if (e.key === "Escape") { setMega(false); setOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${scrolled || mega ? "border-line bg-paper/90 backdrop-blur-xl" : "border-transparent bg-paper/0"}`}
        onMouseLeave={() => setMega(false)}
      >
        <div className="shell flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
          <Link href="/" aria-label="OSAKA TOOL home" className="shrink-0"><Logo /></Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setMega(item.href === "/products")}
                onFocus={() => setMega(item.href === "/products")}
                aria-expanded={item.href === "/products" ? mega : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[0.9rem] transition-colors hover:text-beni ${active(item.href) ? "text-ink" : "text-ink-2"}`}
              >
                {item.label}
                {active(item.href) && <span className="absolute inset-x-3.5 -bottom-[0.2rem] h-px bg-beni" />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setSearch(true)} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-ink-2 transition hover:bg-paper-2" aria-label="Search products">
              <Search className="h-[1.1rem] w-[1.1rem]" />
              <kbd className="hidden rounded border border-line px-1.5 font-mono text-[0.65rem] text-faint xl:inline">Ctrl K</kbd>
            </button>
            <Link href="/rfq" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-2 transition hover:bg-paper-2" aria-label={`Quote request, ${items.length} items`}>
              <ClipboardList className="h-[1.1rem] w-[1.1rem]" />
              {items.length > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-beni px-1 font-mono text-[0.6rem] text-white">{items.length}</span>
              )}
            </Link>
            <Link href="/contact" className="btn btn-primary ml-1 hidden !min-h-10 !py-2 text-sm sm:inline-flex">Contact sales</Link>
            <button onClick={() => setOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden" aria-label="Open menu" aria-expanded={open}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Product mega menu */}
        <div className={`absolute inset-x-0 top-full hidden border-b border-line bg-paper/95 backdrop-blur-xl transition-all duration-300 lg:block ${mega ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}>
          <div className="shell grid grid-cols-12 gap-8 py-10">
            <div className="col-span-3 border-r border-line pr-8">
              <p className="eyebrow">Catalogue</p>
              <p className="mt-4 text-2xl font-semibold leading-tight">Instruments engineered for measurable confidence.</p>
              <Link href="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-beni">All products <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="col-span-9 grid grid-cols-3 gap-x-8 gap-y-7">
              {categories.map((c) => (
                <div key={c.slug}>
                  <Link href={`/categories/${c.slug}`} className="group flex items-center gap-2.5 font-medium">
                    <CategoryIcon name={c.icon} className="h-5 w-5 text-beni" />
                    <span className="group-hover:text-beni">{c.name}</span>
                  </Link>
                  <ul className="mt-2.5 space-y-1.5 pl-[1.9rem]">
                    {c.children.map((child) => (
                      <li key={child.slug}><Link href={`/categories/${child.slug}`} className="text-sm text-mute hover:text-ink">{child.name}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <div className={`fixed inset-0 z-[60] bg-paper transition-all duration-300 lg:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="shell flex h-16 items-center justify-between">
          <Logo />
          <button onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full" aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="shell h-[calc(100dvh-4rem)] overflow-y-auto pb-10" aria-label="Mobile">
          <ul className="border-t border-line">
            {NAV.map((item) => (
              <li key={item.href} className="border-b border-line">
                <Link href={item.href} className="flex items-center justify-between py-4 text-2xl font-medium tracking-tight">
                  {item.label}<ArrowRight className="h-5 w-5 text-faint" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-8">Categories</p>
          <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-paper-2">
                  <CategoryIcon name={c.icon} className="h-5 w-5 text-beni" />{c.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link href="/rfq" className="btn btn-ghost">Quote list ({items.length})</Link>
            <Link href="/contact" className="btn btn-primary">Contact sales</Link>
          </div>
        </nav>
      </div>

      {search && <SearchPalette open onClose={() => setSearch(false)} />}
    </>
  );
}
