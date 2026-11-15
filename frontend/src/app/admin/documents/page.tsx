"use client";

import { useState } from "react";
import { FileText, Plus, Upload } from "lucide-react";
import { admin, uploadFiles } from "@/lib/adminApi";
import type { CompanyDocument } from "@/lib/types";
import { Badge, Field, Modal, PageHeader, StateView, btnDanger, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "@/components/admin/kit";

const day = (d?: string) => (d ? d.slice(0, 10) : "");

export default function Documents() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const [status, setStatus] = useState("");
  const { data, error, loading, reload } = useLoad(() => admin.get<{ documents: CompanyDocument[]; types: string[] }>(`/documents${status ? `?status=${status}` : ""}`), [status]);
  const [edit, setEdit] = useState<Partial<CompanyDocument> | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length || !edit) return;
    const r = await run(() => uploadFiles([files[0]]), "File uploaded");
    if (r) setEdit({ ...edit, file: { url: r.files[0].url, publicId: r.files[0].publicId, format: r.files[0].format }, title: edit.title || r.files[0].name.replace(/\.[a-z]+$/i, "") });
  }
  async function save(extra: Partial<CompanyDocument> = {}) {
    if (!edit) return;
    const body = { ...edit, ...extra };
    if (await run(() => (edit._id ? admin.put(`/documents/${edit._id}`, body) : admin.post("/documents", body)), "Saved")) { setEdit(null); reload(); }
  }
  async function remove() {
    if (!edit?._id || !confirm("Delete this document record?")) return;
    if (await run(() => admin.del(`/documents/${edit._id}`), "Deleted")) { setEdit(null); reload(); }
  }

  return (
    <>
      <PageHeader title="Documents & evidence" subtitle="Company registration, trademarks, certificates, regulatory registrations and test reports. Only verified documents marked public appear on the website."
        actions={can("documents:write") && <button onClick={() => setEdit({ type: "certificate", public: false })} className={btnPrimary}><Plus className="h-4 w-4" />Add document</button>} />
      <div className="mb-4 flex flex-wrap gap-1">
        {["", "pending", "verified", "rejected", "expired"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-sm ${status === s ? "bg-ink text-paper" : "bg-white hover:bg-paper-2"}`}>{s || "All"}</button>
        ))}
      </div>
      <StateView loading={loading} error={error} empty={!data?.documents.length}>
        <ul className="divide-y divide-line-2 rounded-2xl border border-line bg-white">
          {data?.documents.map((d) => (
            <li key={d._id}>
              <button onClick={() => setEdit(d)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-paper">
                <FileText className="h-5 w-5 shrink-0 text-beni" strokeWidth={1.5} />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{d.title}</span><span className="block truncate text-xs text-mute">{[d.type, d.issuer, d.number].filter(Boolean).join(" · ")}</span></span>
                {d.public && <Badge value="published">public</Badge>}<Badge value={d.status} />
              </button>
            </li>
          ))}
        </ul>
      </StateView>

      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? "Document" : "Add document"} wide>
        {edit && (
          <fieldset disabled={!can("documents:write")} className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2"><input className="field" value={edit.title || ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Type">
              <select className="field" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>{data?.types.map((t) => <option key={t}>{t}</option>)}</select>
            </Field>
            <Field label="Issuer"><input className="field" value={edit.issuer || ""} onChange={(e) => setEdit({ ...edit, issuer: e.target.value })} /></Field>
            <Field label="Document / registration number"><input className="field font-mono" value={edit.number || ""} onChange={(e) => setEdit({ ...edit, number: e.target.value })} /></Field>
            <Field label="Jurisdiction"><input className="field" value={edit.jurisdiction || ""} onChange={(e) => setEdit({ ...edit, jurisdiction: e.target.value })} /></Field>
            <Field label="Issued"><input type="date" className="field" value={day(edit.issuedAt)} onChange={(e) => setEdit({ ...edit, issuedAt: e.target.value })} /></Field>
            <Field label="Expires"><input type="date" className="field" value={day(edit.expiresAt)} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value })} /></Field>
            <Field label="Public summary" className="sm:col-span-2"><textarea className="field" rows={2} value={edit.summary || ""} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} /></Field>
            <div className="sm:col-span-2">
              <span className="label">File (PDF or image)</span>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`${btnGhost} cursor-pointer`}><Upload className="h-4 w-4" />Upload<input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => upload(e.target.files)} /></label>
                {edit.file?.url && <a href={edit.file.url} target="_blank" rel="noopener" className="text-sm text-beni underline">Open current file</a>}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={Boolean(edit.public)} disabled={edit.status !== "verified"} onChange={(e) => setEdit({ ...edit, public: e.target.checked })} />
              Show on the public Quality page {edit.status !== "verified" && <span className="text-xs text-faint">(available after verification)</span>}
            </label>
            {edit._id && <p className="text-xs text-mute sm:col-span-2">Status: <Badge value={edit.status || "pending"} /> {edit.verifiedBy && `by ${edit.verifiedBy} on ${fmtDate(edit.verifiedAt)}`}</p>}
            <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
              {edit._id && can("documents:verify") && <button type="button" onClick={remove} className={btnDanger}>Delete</button>}
              {edit._id && can("documents:verify") && edit.status !== "rejected" && <button type="button" disabled={busy} onClick={() => save({ status: "rejected", public: false })} className={btnGhost}>Reject</button>}
              {edit._id && can("documents:verify") && edit.status !== "verified" && <button type="button" disabled={busy || !edit.file?.url} onClick={() => save({ status: "verified" })} className={btnGhost}>Mark verified</button>}
              <button type="button" disabled={busy} onClick={() => save()} className={btnPrimary}>Save</button>
            </div>
          </fieldset>
        )}
      </Modal>
    </>
  );
}
