"use client";

import { useState } from "react";
import { Eye, Play } from "lucide-react";
import { admin } from "@/lib/adminApi";
import type { ImportJob } from "@/lib/types";
import { Badge, PageHeader, Panel, StateView, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "@/components/admin/kit";

export default function Imports() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const { data, error, loading, reload } = useLoad(() => admin.get<{ jobs: ImportJob[]; sources: string[] }>("/imports"));
  const [current, setCurrent] = useState<ImportJob | null>(null);
  const [autoPublish, setAutoPublish] = useState(true);
  const [showSkipped, setShowSkipped] = useState(false);

  async function start(mode: "preview" | "commit") {
    if (mode === "commit" && !confirm("Commit this import to the live catalogue?")) return;
    const r = await run(() => admin.post<{ job: ImportJob }>("/imports", { source: "primegadgets", mode, autoPublish }), mode === "preview" ? "Preview ready" : "Import committed");
    if (r) { setCurrent(r.job); reload(); }
  }

  const job = current;
  return (
    <>
      <PageHeader title="Catalogue imports" subtitle="Pull relevant products from company-owned sources with relevance filtering, deduplication and provenance." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Prime Gadgets UAE" className="lg:col-span-1">
          <p className="text-sm text-mute">Reads the store’s product API, keeps only items that fit the OSAKA TOOL taxonomy, extracts model numbers and specifications, and records the source of every record.</p>
          <ul className="mt-4 space-y-1 text-xs text-mute">
            <li>• Deduplicates by source ID, model number and SKU</li>
            <li>• Preserves the actual manufacturer. Products are never rebranded.</li>
            <li>• Medical devices always land in review</li>
            <li>• Re-imports update drafts only. Published listings are flagged for review.</li>
          </ul>
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />Auto-publish complete non-medical records</label>
          <div className="mt-5 flex flex-wrap gap-2">
            {can("imports:preview") && <button disabled={busy} onClick={() => start("preview")} className={btnGhost}><Eye className="h-4 w-4" />Preview</button>}
            {can("imports:commit") && <button disabled={busy} onClick={() => start("commit")} className={btnPrimary}><Play className="h-4 w-4" />Commit import</button>}
          </div>
        </Panel>

        <Panel title={job ? `${job.mode === "preview" ? "Preview" : "Result"} · ${fmtDate(job.createdAt)}` : "Select a run"} className="lg:col-span-2">
          {!job ? <p className="text-sm text-mute">Run a preview or open a previous job.</p> : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
                {Object.entries(job.stats).map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-paper p-3 text-center"><p className="text-xl font-semibold tabular-nums">{v}</p><p className="font-mono text-[0.6rem] uppercase text-faint">{k}</p></div>
                ))}
              </div>
              {job.errorLog.length > 0 && <ul className="mt-4 space-y-1 rounded-xl bg-beni-soft p-3 text-sm text-beni">{job.errorLog.map((e, i) => <li key={i}>{e.sourceId && <span className="font-mono">{e.sourceId}: </span>}{e.message}</li>)}</ul>}
              <label className="mt-4 flex items-center gap-2 text-xs text-mute"><input type="checkbox" checked={showSkipped} onChange={(e) => setShowSkipped(e.target.checked)} />Show skipped items</label>
              <ul className="mt-2 divide-y divide-line-2 text-sm">
                {job.items.filter((i) => showSkipped || i.action !== "skip").map((i) => (
                  <li key={i.sourceId + i.action} className="flex items-center gap-3 py-2">
                    <Badge value={i.action.startsWith("create") ? "published" : i.action === "skip" ? "draft" : i.action === "duplicate" ? "review" : "in-progress"}>{i.action}</Badge>
                    <span className="min-w-0 flex-1 truncate">{i.name}</span>
                    <span className="hidden font-mono text-xs text-faint sm:block">{i.category || i.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <Panel title="Import history" className="mt-5">
        <StateView loading={loading} error={error} empty={!data?.jobs.length}>
          <ul className="divide-y divide-line-2 text-sm">
            {data?.jobs.map((j) => (
              <li key={j._id}>
                <button onClick={() => setCurrent(j)} className="flex w-full flex-wrap items-center gap-3 py-2.5 text-left hover:text-beni">
                  <Badge value={j.status} /><span className="font-mono">{j.mode}</span><span className="text-mute">{j.source} · by {j.startedBy}</span>
                  <span className="ml-auto font-mono text-xs text-faint">{j.stats.relevant}/{j.stats.fetched} relevant · {j.stats.created} created · {j.stats.unchanged} unchanged · {fmtDate(j.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </StateView>
      </Panel>
    </>
  );
}
