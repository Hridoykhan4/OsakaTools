"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2, ClipboardList, Download, FileCheck2, FolderTree, Gauge, History, LayoutDashboard, LogOut, Menu, Newspaper,
  Package, Radar, Settings2, Tags, Users, X,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { admin } from "@/lib/adminApi";
import type { Session } from "@/lib/types";
import { SessionContext, ToastProvider } from "./kit";

const NAV = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard:read" }] },
  { group: "Catalogue", items: [
    { href: "/admin/products", label: "Products", icon: Package, perm: "dashboard:read" },
    { href: "/admin/categories", label: "Categories", icon: FolderTree, perm: "dashboard:read" },
    { href: "/admin/brands", label: "Brands & makers", icon: Tags, perm: "dashboard:read" },
    { href: "/admin/imports", label: "Imports", icon: Download, perm: "dashboard:read" },
    { href: "/admin/documents", label: "Documents & evidence", icon: FileCheck2, perm: "dashboard:read" },
  ] },
  { group: "Sales", items: [
    { href: "/admin/inquiries", label: "RFQs & inquiries", icon: ClipboardList, perm: "dashboard:read" },
    { href: "/admin/organizations", label: "Organizations", icon: Building2, perm: "dashboard:read" },
  ] },
  { group: "Content & system", items: [
    { href: "/admin/settings", label: "Site settings", icon: Settings2, perm: "dashboard:read" },
    { href: "/admin/articles", label: "Articles", icon: Newspaper, perm: "dashboard:read" },
    { href: "/admin/search-indexing", label: "Search indexing", icon: Radar, perm: "dashboard:read" },
    { href: "/admin/audit", label: "Audit log", icon: History, perm: "audit:read" },
    { href: "/admin/users", label: "Users & access", icon: Users, perm: "dashboard:read" },
  ] },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const isLogin = pathname.startsWith("/admin/login");

  // Close the mobile drawer on navigation (state adjusted during render, not in an effect).
  if (lastPath !== pathname) { setLastPath(pathname); setOpen(false); }

  // Re-validate the session on every admin navigation.
  useEffect(() => {
    if (isLogin) return;
    let alive = true;
    admin.get<{ admin: Session }>("/auth/me")
      .then((r) => { if (alive) setSession(r.admin); })
      .catch(() => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`));
    return () => { alive = false; };
  }, [isLogin, pathname, router]);

  if (isLogin) return <ToastProvider>{children}</ToastProvider>;
  if (!session) {
    return <div className="grid min-h-screen place-items-center bg-paper"><div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-beni" aria-label="Checking session" /></div>;
  }

  const logout = async () => { await admin.post("/auth/logout").catch(() => {}); router.replace("/admin/login"); };
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin"><Logo /></Link>
        <button className="rounded-full p-1.5 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Admin">
        {NAV.map((g) => {
          const items = g.items.filter((i) => session.permissions.includes(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              <p className="px-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">{g.group}</p>
              <ul className="mt-2 space-y-0.5">
                {items.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link href={href} aria-current={active(href) ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${active(href) ? "bg-beni text-white" : "text-ink-2 hover:bg-paper-2"}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.6} />{label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-beni font-semibold uppercase text-white">{session.username[0]}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{session.name || session.username}</p><p className="font-mono text-[0.65rem] uppercase text-faint">{session.role}</p></div>
          <button onClick={logout} className="rounded-full p-2 text-mute hover:bg-paper-2 hover:text-beni" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>
        <Link href="/" target="_blank" className="mt-3 flex items-center gap-2 text-xs text-mute hover:text-ink"><Gauge className="h-3.5 w-3.5" />View public website</Link>
      </div>
    </div>
  );

  return (
    <SessionContext.Provider value={session}>
      <ToastProvider>
        <div className="min-h-screen bg-paper lg:flex">
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-white lg:block">{sidebar}</aside>
          {open && <div className="fixed inset-0 z-50 bg-paper/70 lg:hidden" onClick={() => setOpen(false)} />}
          <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-white transition-transform lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</aside>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
              <button onClick={() => setOpen(true)} className="rounded-full p-2" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
              <Logo />
            </header>
            <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </SessionContext.Provider>
  );
}
