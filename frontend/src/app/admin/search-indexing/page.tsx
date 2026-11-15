"use client";

import { ExternalLink } from "lucide-react";
import { admin } from "@/lib/adminApi";
import { PageHeader, Panel, StateView, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "@/components/admin/kit";

interface Status { enabled: boolean; pending: number | null; keyUrl: string; message: string; lastAttemptAt?: string; lastReceivedAt?: string;
  lastStatus?: number; nextRunAt?: string; result?: { message: string } }

const TOOLS = [
  ["Google Search Console", "https://search.google.com/search-console"], ["Bing Webmaster Tools", "https://www.bing.com/webmasters/"],
  ["Rich Results Test", "https://search.google.com/test/rich-results"], ["IndexNow documentation", "https://www.indexnow.org/documentation"],
];

export default function SearchIndexing() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const { data, error, loading, setData } = useLoad(() => admin.get<Status>("/indexing"));
  const act = async (path: string) => { const r = await run(() => admin.post<Status>(`/indexing/${path}`)); if (r) setData(r); };
  return (
    <>
      <PageHeader title="Search indexing" subtitle="Sitemaps help engines discover URLs; IndexNow notifies Bing, Yandex and others of changes. A submission receipt does not mean a page is indexed." />
      <StateView loading={loading} error={error}>
        {data && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="IndexNow">
              <p className="text-sm">{data.result?.message || data.message}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-mute">Enabled</dt><dd>{data.enabled ? "Yes" : "No (production only)"}</dd>
                <dt className="text-mute">Pending URLs</dt><dd className="font-mono">{data.pending ?? "—"}</dd>
                <dt className="text-mute">Last attempt</dt><dd className="text-xs">{fmtDate(data.lastAttemptAt)}</dd>
                <dt className="text-mute">Last receipt</dt><dd className="text-xs">{fmtDate(data.lastReceivedAt)}</dd>
                <dt className="text-mute">Key file</dt><dd className="break-all font-mono text-xs">{data.keyUrl}</dd>
              </dl>
              {can("indexing:write") && data.enabled && (
                <div className="mt-5 flex gap-2">
                  <button disabled={busy} onClick={() => act("catalogue")} className={btnPrimary}>Queue full catalogue</button>
                  <button disabled={busy} onClick={() => act("retry")} className={btnGhost}>Submit pending now</button>
                </div>
              )}
            </Panel>
            <Panel title="Webmaster tools">
              <ul className="space-y-2">{TOOLS.map(([label, href]) => <li key={href}><a href={href} target="_blank" rel="noopener" className="flex items-center justify-between rounded-xl border border-line p-3 text-sm hover:border-ink">{label}<ExternalLink className="h-4 w-4 text-faint" /></a></li>)}</ul>
              <p className="mt-4 text-xs text-mute">Activation requires SITE_INDEXABLE=true and the production domain. See DEPLOYMENT.md.</p>
            </Panel>
          </div>
        )}
      </StateView>
    </>
  );
}
