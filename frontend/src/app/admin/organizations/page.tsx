"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { admin } from "@/lib/adminApi";
import type { Organization } from "@/lib/types";
import { Badge, Field, Modal, PageHeader, StateView, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "@/components/admin/kit";

export default function Organizations() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useLoad(() => admin.get<{ organizations: Organization[]; segments: string[] }>(`/organizations${q ? `?q=${encodeURIComponent(q)}` : ""}`), [q]);
  const [edit, setEdit] = useState<Partial<Organization> | null>(null);

  async function save() {
    if (!edit) return;
    if (await run(() => (edit._id ? admin.put(`/organizations/${edit._id}`, edit) : admin.post("/organizations", edit)), "Saved")) { setEdit(null); reload(); }
  }

  return (
    <>
      <PageHeader title="Organizations" subtitle="Customer and partner records. Inquiries with a company name are linked automatically."
        actions={can("inquiries:write") && <button onClick={() => setEdit({ name: "", segment: "other" })} className={btnPrimary}><Plus className="h-4 w-4" />New organization</button>} />
      <input placeholder="Search organizations" aria-label="Search organizations" className="field mb-4 max-w-md" onKeyDown={(e) => e.key === "Enter" && setQ((e.target as HTMLInputElement).value)} />
      <StateView loading={loading} error={error} empty={!data?.organizations.length}>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-line text-left font-mono text-xs uppercase text-faint"><th className="p-3">Name</th><th className="p-3">Segment</th><th className="p-3">Country</th><th className="p-3">Contacts</th><th className="p-3">Inquiries</th><th className="p-3">Last inquiry</th></tr></thead>
            <tbody className="divide-y divide-line-2">
              {data?.organizations.map((o) => (
                <tr key={o._id} onClick={() => setEdit(o)} className="cursor-pointer hover:bg-paper">
                  <td className="p-3 font-medium">{o.name}</td><td className="p-3"><Badge value={o.segment} /></td><td className="p-3">{o.country}</td>
                  <td className="p-3 text-mute">{o.contacts.map((c) => c.email).join(", ")}</td><td className="p-3 font-mono">{o.inquiryCount}</td><td className="p-3 font-mono text-xs">{fmtDate(o.lastInquiryAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StateView>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? edit.name || "" : "New organization"}>
        {edit && (
          <fieldset disabled={!can("inquiries:write")} className="space-y-4">
            <Field label="Name"><input className="field" value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Segment"><select className="field" value={edit.segment} onChange={(e) => setEdit({ ...edit, segment: e.target.value })}>{data?.segments.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Country"><input className="field" value={edit.country || ""} onChange={(e) => setEdit({ ...edit, country: e.target.value })} /></Field>
            <Field label="Website"><input className="field" value={edit.website || ""} onChange={(e) => setEdit({ ...edit, website: e.target.value })} /></Field>
            <Field label="Notes"><textarea className="field" rows={4} value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
            {edit.contacts && edit.contacts.length > 0 && <div><span className="label">Contacts</span><ul className="text-sm">{edit.contacts.map((c, i) => <li key={i}>{c.name} · {c.email} {c.phone && `· ${c.phone}`}</li>)}</ul></div>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEdit(null)} className={btnGhost}>Cancel</button><button type="button" disabled={busy} onClick={save} className={btnPrimary}>Save</button></div>
          </fieldset>
        )}
      </Modal>
    </>
  );
}
