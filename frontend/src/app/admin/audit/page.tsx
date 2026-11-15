"use client";

import { useState } from "react";
import { admin, qs } from "@/lib/adminApi";
import type { AuditEntry, Pagination } from "@/lib/types";
import { Badge, PageHeader, StateView, btnGhost, fmtDate, useLoad } from "@/components/admin/kit";

const ENTITIES = ["", "product", "category", "brand", "document", "inquiry", "organization", "article", "import", "user", "session", "media"];

export default function Audit() {
  const [f, setF] = useState({ entity: "", page: 1 });
  const [open, setOpen] = useState<string | null>(null);
  const { data, error, loading } = useLoad(() => admin.get<{ logs: AuditEntry[]; pagination: Pagination }>(`/audit${qs({ ...f, limit: 50 })}`), [f]);
  return (
    <>
      <PageHeader title="Audit log" subtitle="Every sign-in and change, with the actor, role and changed fields." />
      <div className="scrollbar-none mb-4 flex gap-1 overflow-x-auto">
        {ENTITIES.map((e) => <button key={e} onClick={() => setF({ entity: e, page: 1 })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${f.entity === e ? "bg-ink text-paper" : "bg-white"}`}>{e || "All"}</button>)}
      </div>
      <StateView loading={loading} error={error} empty={!data?.logs.length}>
        <ul className="divide-y divide-line-2 rounded-2xl border border-line bg-white text-sm">
          {data?.logs.map((l) => (
            <li key={l._id} className="p-3">
              <button onClick={() => setOpen(open === l._id ? null : l._id)} className="grid w-full gap-1 text-left sm:grid-cols-[10rem_7rem_1fr] sm:items-center">
                <span className="font-mono text-xs text-faint">{fmtDate(l.createdAt)}</span>
                <span><Badge value={l.entity}>{l.action}</Badge></span>
                <span className="min-w-0"><b className="font-medium">{l.actor}</b> <span className="text-mute">{l.summary}</span></span>
              </button>
              {open === l._id && (
                <pre className="mt-2 overflow-x-auto rounded-xl bg-paper p-3 font-mono text-xs">{JSON.stringify({ role: l.role, entityId: l.entityId, ip: l.ip, changes: l.changes }, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
        {data && data.pagination.pages > 1 && (
          <div className="mt-4 flex justify-end gap-2">
            <button className={btnGhost} disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>Newer</button>
            <button className={btnGhost} disabled={f.page >= data.pagination.pages} onClick={() => setF({ ...f, page: f.page + 1 })}>Older</button>
          </div>
        )}
      </StateView>
    </>
  );
}
