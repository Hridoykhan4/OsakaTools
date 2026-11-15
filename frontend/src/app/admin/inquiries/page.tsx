"use client";

import { useState } from "react";
import { Mail, Search } from "lucide-react";
import { admin, qs } from "@/lib/adminApi";
import type { Inquiry, Pagination } from "@/lib/types";
import { Badge, Field, Modal, PageHeader, StateView, btnDanger, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "@/components/admin/kit";

const STATUSES = ["new", "in-progress", "quoted", "won", "lost", "closed", "spam"];
type Data = { inquiries: Inquiry[]; unread: number; byStatus: Record<string, number>; pagination: Pagination };

export default function Inquiries() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const [f, setF] = useState({ status: "", type: "", q: "", page: 1 });
  const { data, error, loading, reload, setData } = useLoad(() => admin.get<Data>(`/inquiries${qs(f)}`), [f]);
  const [open, setOpen] = useState<Inquiry | null>(null);
  const [note, setNote] = useState("");

  async function update(patch: Record<string, unknown>, msg = "Updated") {
    if (!open) return;
    const r = await run(() => admin.put<{ inquiry: Inquiry }>(`/inquiries/${open._id}`, patch), msg);
    if (r) {
      setOpen({ ...r.inquiry, organization: open.organization });
      setData((d) => d && { ...d, inquiries: d.inquiries.map((i) => (i._id === r.inquiry._id ? { ...r.inquiry, organization: i.organization } : i)) });
    }
  }
  async function view(i: Inquiry) {
    setOpen(i); setNote("");
    if (!i.read && can("inquiries:write")) {
      await admin.put(`/inquiries/${i._id}`, { read: true }).catch(() => {});
      setData((d) => d && { ...d, unread: Math.max(0, d.unread - 1), inquiries: d.inquiries.map((x) => (x._id === i._id ? { ...x, read: true } : x)) });
    }
  }
  async function remove() {
    if (!open || !confirm("Delete this inquiry?")) return;
    if (await run(() => admin.del(`/inquiries/${open._id}`), "Deleted")) { setOpen(null); reload(); }
  }

  return (
    <>
      <PageHeader title="RFQs & inquiries" subtitle={data ? `${data.pagination.total} inquiries · ${data.unread} unread` : undefined} />
      <div className="scrollbar-none mb-4 flex gap-1 overflow-x-auto">
        <button onClick={() => setF({ ...f, status: "", page: 1 })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${!f.status ? "bg-ink text-paper" : "bg-white"}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setF({ ...f, status: s, page: 1 })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${f.status === s ? "bg-ink text-paper" : "bg-white"}`}>
            {s} <span className="font-mono text-xs opacity-60">{data?.byStatus[s] || 0}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3">
          <Search className="h-4 w-4 text-faint" />
          <input placeholder="Search name, email, company, subject" aria-label="Search inquiries" className="h-10 flex-1 bg-transparent text-sm outline-none"
            onKeyDown={(e) => e.key === "Enter" && setF({ ...f, q: (e.target as HTMLInputElement).value, page: 1 })} />
        </div>
        <select className="field !min-h-10 sm:w-44" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, page: 1 })} aria-label="Type">
          <option value="">All types</option>{["rfq", "contact", "sourcing", "distribution"].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <StateView loading={loading} error={error} empty={!data?.inquiries.length}>
        <ul className="divide-y divide-line-2 rounded-2xl border border-line bg-white">
          {data?.inquiries.map((i) => (
            <li key={i._id}>
              <button onClick={() => view(i)} className="grid w-full gap-1 p-4 text-left hover:bg-paper sm:grid-cols-[1fr_auto] sm:items-center">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">{!i.read && <span className="h-2 w-2 rounded-full bg-beni" aria-label="Unread" />}<span className={`truncate ${i.read ? "" : "font-semibold"}`}>{i.name}</span>
                    <span className="truncate text-sm text-mute">{i.company || i.email}</span></span>
                  <span className="mt-0.5 block truncate text-sm text-mute">{i.items.length ? `${i.items.length} items: ${i.items.map((x) => x.name).join(", ")}` : i.subject || i.message}</span>
                </span>
                <span className="flex items-center gap-2"><Badge value={i.type}>{i.type}</Badge><Badge value={i.status} /><span className="font-mono text-xs text-faint">{fmtDate(i.createdAt)}</span></span>
              </button>
            </li>
          ))}
        </ul>
        {data && data.pagination.pages > 1 && (
          <div className="mt-4 flex justify-end gap-2">
            <button className={btnGhost} disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>Previous</button>
            <button className={btnGhost} disabled={f.page >= data.pagination.pages} onClick={() => setF({ ...f, page: f.page + 1 })}>Next</button>
          </div>
        )}
      </StateView>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.type.toUpperCase()} from ${open.name}` : ""} wide>
        {open && (
          <div className="space-y-5">
            <dl className="grid gap-3 rounded-2xl bg-white p-4 text-sm sm:grid-cols-2">
              {[["Email", open.email], ["Phone", open.phone], ["Company", open.organization?.name || open.company], ["Country", open.country], ["Received", fmtDate(open.createdAt)], ["Page", open.sourcePage]]
                .filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-xs text-faint">{k}</dt><dd className="break-words">{v}</dd></div>)}
            </dl>
            {open.items.length > 0 && (
              <table className="w-full overflow-hidden rounded-xl bg-white text-sm">
                <thead><tr className="text-left font-mono text-xs text-faint"><th className="p-2">Item</th><th className="p-2">SKU</th><th className="p-2 text-right">Qty</th></tr></thead>
                <tbody className="divide-y divide-line-2">{open.items.map((x, i) => <tr key={i}><td className="p-2">{x.name}</td><td className="p-2 font-mono text-xs">{x.sku}</td><td className="p-2 text-right font-mono">{x.quantity}</td></tr>)}</tbody>
              </table>
            )}
            {open.message && <p className="whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm">{open.message}</p>}
            <fieldset disabled={!can("inquiries:write")} className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <select className="field" value={open.status} onChange={(e) => update({ status: e.target.value }, `Marked ${e.target.value}`)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field label="Assigned to"><input className="field" defaultValue={open.assignedTo} onBlur={(e) => e.target.value !== open.assignedTo && update({ assignedTo: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <span className="label">Internal notes</span>
                <ul className="mb-2 space-y-2">{open.notes.map((n, i) => <li key={i} className="rounded-xl bg-white p-3 text-sm"><p>{n.text}</p><p className="mt-1 font-mono text-xs text-faint">{n.by} · {fmtDate(n.at)}</p></li>)}</ul>
                <div className="flex gap-2">
                  <input className="field" placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button type="button" disabled={busy || !note.trim()} onClick={async () => { await update({ note }, "Note added"); setNote(""); }} className={btnPrimary}>Add</button>
                </div>
              </div>
            </fieldset>
            <div className="flex flex-wrap justify-between gap-2">
              <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: your ${open.type === "rfq" ? "quote request" : "inquiry"} — OSAKA TOOL`)}`} className={btnGhost}><Mail className="h-4 w-4" />Reply by email</a>
              {can("inquiries:delete") && <button onClick={remove} className={btnDanger}>Delete</button>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
