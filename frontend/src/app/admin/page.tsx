"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { admin } from "@/lib/adminApi";
import type { AuditEntry } from "@/lib/types";
import { Badge, PageHeader, Panel, StateView, fmtDate, useLoad, useSession } from "@/components/admin/kit";

interface Stats {
  products: { byStatus: Record<string, number>; byCategory: { name: string; n: number }[]; total: number };
  categories: number; articles: number; organizations: number;
  inquiries: { byStatus: Record<string, number>; byType: Record<string, number>; daily: { date: string; count: number }[]; open: number };
  documents: Record<string, number>;
  attention: { id: string; name: string; blockers: string[] }[];
  lastImport?: { status: string; stats: Record<string, number>; createdAt: string; source: string } | null;
  recent: AuditEntry[];
}

function Kpi({ label, value, hint, href }: { label: string; value: number | string; hint?: string; href: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-line bg-white p-5 transition hover:border-ink">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className="mt-3 text-4xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </Link>
  );
}

export default function Dashboard() {
  const { session } = useSession();
  const { data, error, loading } = useLoad(() => admin.get<Stats>("/stats"));
  const maxDaily = Math.max(1, ...(data?.inquiries.daily.map((d) => d.count) || [1]));
  const maxCat = Math.max(1, ...(data?.products.byCategory.map((c) => c.n) || [1]));
  const total30 = data?.inquiries.daily.reduce((s, d) => s + d.count, 0) || 0;

  return (
    <>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${session?.name || session?.username}`}
        subtitle="Catalogue health, sales pipeline and evidence status at a glance." />
      <StateView loading={loading} error={error}>
        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi label="Published products" value={data.products.byStatus.published || 0} hint={`${data.products.total} total · ${data.products.byStatus.review || 0} in review`} href="/admin/products" />
              <Kpi label="Open inquiries" value={data.inquiries.open} hint={`${data.inquiries.byStatus.new || 0} new`} href="/admin/inquiries" />
              <Kpi label="Verified documents" value={data.documents.verified || 0} hint={`${data.documents.pending || 0} awaiting verification`} href="/admin/documents" />
              <Kpi label="Organizations" value={data.organizations} hint={`${data.categories} categories · ${data.articles} articles`} href="/admin/organizations" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title={`Inquiries · last 30 days (${total30})`} className="lg:col-span-2">
                <div className="flex h-40 items-end gap-1" role="img" aria-label={`${total30} inquiries in the last 30 days`}>
                  {data.inquiries.daily.map((d) => (
                    <div key={d.date} className="group relative flex-1">
                      <div className="rounded-t bg-ink transition group-hover:bg-beni" style={{ height: `${Math.max(2, (d.count / maxDaily) * 150)}px` }} />
                      <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 font-mono text-[0.6rem] text-white group-hover:block">{d.date.slice(5)} · {d.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(data.inquiries.byType).map(([k, v]) => <span key={k} className="rounded-full bg-paper-2 px-3 py-1 font-mono text-xs">{k}: {v}</span>)}
                </div>
              </Panel>
              <Panel title="Pipeline">
                <ul className="space-y-2 text-sm">
                  {["new", "in-progress", "quoted", "won", "lost", "closed"].map((s) => (
                    <li key={s} className="flex items-center justify-between"><Badge value={s} /><span className="font-mono">{data.inquiries.byStatus[s] || 0}</span></li>
                  ))}
                </ul>
              </Panel>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Published by category">
                {data.products.byCategory.length === 0 ? <p className="text-sm text-mute">No published products yet.</p> : (
                  <ul className="space-y-3">
                    {data.products.byCategory.map((c) => (
                      <li key={c.name}>
                        <div className="flex justify-between text-sm"><span>{c.name}</span><span className="font-mono">{c.n}</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-paper-2"><div className="h-full rounded-full bg-beni" style={{ width: `${(c.n / maxCat) * 100}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel title="Needs attention" className="lg:col-span-2">
                {data.attention.length === 0 ? <p className="text-sm text-mute">Every draft is complete. Nothing is blocking publication.</p> : (
                  <ul className="divide-y divide-line-2">
                    {data.attention.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                        <div className="min-w-0 flex-1">
                          <Link href={`/admin/products/${a.id}`} className="font-medium hover:text-beni">{a.name}</Link>
                          <p className="text-xs text-mute">{a.blockers.join(" · ")}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Last catalogue import">
                {data.lastImport ? (
                  <div className="text-sm">
                    <div className="flex items-center justify-between"><span className="font-mono">{data.lastImport.source}</span><Badge value={data.lastImport.status} /></div>
                    <p className="mt-2 text-mute">{fmtDate(data.lastImport.createdAt)}</p>
                    <p className="mt-3 font-mono text-xs">{data.lastImport.stats.relevant} relevant / {data.lastImport.stats.fetched} fetched · {data.lastImport.stats.created} created · {data.lastImport.stats.errors} errors</p>
                  </div>
                ) : <p className="text-sm text-mute">No committed import yet.</p>}
                <Link href="/admin/imports" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-beni">Open imports <ArrowRight className="h-4 w-4" /></Link>
              </Panel>
              <Panel title="Recent activity" className="lg:col-span-2">
                {data.recent.length === 0 ? <p className="text-sm text-mute">Activity is visible to admins.</p> : (
                  <ul className="space-y-2.5 text-sm">
                    {data.recent.map((r) => (
                      <li key={r._id} className="flex gap-3"><span className="w-28 shrink-0 font-mono text-xs text-faint">{fmtDate(r.createdAt).split(",")[0]}</span><span className="min-w-0"><b className="font-medium">{r.actor}</b> <span className="text-mute">{r.summary}</span></span></li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        )}
      </StateView>
    </>
  );
}
