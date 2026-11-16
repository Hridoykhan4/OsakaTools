"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ClipboardList, Menu, Search, X } from "lucide-react";
import { CategoryIcon, Logo } from "./brand";
import SearchPalette from "./SearchPalette";
import { NAV } from "@/lib/site";
import { useRfq } from "@/lib/client-store";

export interface NavCategory { slug: string; name: string; icon?: string; tagline?: string; children: { slug: string; name: string }[] }

export default function Header({ categories, announcement }: { categories: NavCategory[]; announcement?: { text: string; href: string; active: boolean } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [family, setFamily] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hover intent: open after a short pause, close shortly after the pointer leaves header and panel.
  const openMega = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setMega(true), 120); };
  const closeMega = (delay = 180) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setMega(false), delay); };
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items } = useRfq();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setOpen(false); setMega(false); }
  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 8); setMega(false); };
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
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-beni focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      {announcement?.active && announcement.text && (
        <div className="relative z-50 border-b border-beni/20 bg-beni-soft text-center text-[0.82rem] text-beni">
          <div className="shell py-2">
            {announcement.href ? <Link href={announcement.href} className="underline-offset-4 hover:underline">{announcement.text}</Link> : announcement.text}
          </div>
        </div>
      )}
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${scrolled || mega ? "border-line bg-paper/90 backdrop-blur-xl" : "border-transparent bg-paper/0"}`}
        onMouseLeave={() => closeMega()}
        onMouseEnter={() => { if (mega && timer.current) clearTimeout(timer.current); }}
      >
        <div className="shell flex h-16 items-center justify-between gap-3 sm:gap-6 lg:h-[4.5rem]">
          <Link href="/" aria-label="OSAKA TOOL home" className="shrink-0"><Logo /></Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => (item.href === "/products" ? openMega() : closeMega(0))}
                onFocus={() => (item.href === "/products" ? setMega(true) : setMega(false))}
                aria-expanded={item.href === "/products" ? mega : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[0.9rem] transition-colors hover:text-beni ${active(item.href) ? "text-ink" : "text-ink-2"}`}
              >
                {item.label}
                {active(item.href) && <span className="absolute inset-x-3.5 -bottom-[0.2rem] h-px bg-beni" />}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
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

        {/* Product mega menu: compact two-pane panel; families on the left, their categories on the right. */}
        {mega && (
          <div className="absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-[0_30px_60px_-30px_rgba(23,24,26,0.25)] lg:block">
            <div className="shell grid grid-cols-12 gap-10 py-8">
              <ul className="col-span-5 border-r border-line pr-6" role="list">
                {categories.map((c, i) => (
                  <li key={c.slug}>
                    <Link href={`/categories/${c.slug}`} onMouseEnter={() => setFamily(i)} onFocus={() => setFamily(i)}
                      className={`flex items-center gap-3 rounded-sm px-3 py-2.5 transition-colors ${i === family ? "bg-white text-beni" : "text-ink-2 hover:text-ink"}`}>
                      <CategoryIcon name={c.icon} className="h-5 w-5 shrink-0" />
                      <span className="flex-1 font-medium">{c.name}</span>
                      <ArrowRight className={`h-4 w-4 transition ${i === family ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"}`} />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="col-span-7">
                {categories[family] && (
                  <>
                    <p className="font-mincho text-2xl font-semibold">{categories[family].name}</p>
                    {categories[family].tagline && <p className="mt-1 text-sm text-mute">{categories[family].tagline}</p>}
                    <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1" role="list">
                      {categories[family].children.map((child) => (
                        <li key={child.slug}><Link href={`/categories/${child.slug}`} className="block rounded-sm px-2 py-1.5 text-sm text-ink-2 hover:bg-white hover:text-beni">{child.name}</Link></li>
                      ))}
                    </ul>
                    <div className="mt-8 flex gap-3">
                      <Link href={`/categories/${categories[family].slug}`} className="btn btn-primary !min-h-10 !py-2 text-sm">View {categories[family].name}</Link>
                      <Link href="/products" className="btn btn-ghost !min-h-10 !py-2 text-sm">All products</Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
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
                <Link href={item.href} className="flex items-center justify-between py-4 font-mincho text-2xl font-semibold">
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

      {mega && <div aria-hidden className="fixed inset-0 z-40 hidden bg-paper/50 backdrop-blur-[2px] lg:block" onMouseEnter={() => closeMega(0)} onClick={() => setMega(false)} />}
      {search && <SearchPalette open onClose={() => setSearch(false)} />}
    </>
  );
}
