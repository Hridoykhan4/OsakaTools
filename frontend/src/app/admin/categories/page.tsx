"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { admin } from "@/lib/adminApi";
import type { Category } from "@/lib/types";
import { Field, Modal, PageHeader, StateView, btnDanger, btnGhost, btnPrimary, useAction, useLoad, useSession } from "@/components/admin/kit";

type Edit = Partial<Category> & { parent?: string | null };

export default function Categories() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const { data, error, loading, reload } = useLoad(() => admin.get<{ categories: Category[] }>("/categories"));
  const [edit, setEdit] = useState<Edit | null>(null);
  const cats = data?.categories || [];
  const pid = (c: Category) => (typeof c.parent === "object" && c.parent ? c.parent._id : (c.parent as string)) || null;
  const top = cats.filter((c) => !pid(c));

  async function save() {
    if (!edit) return;
    const body = { ...edit, parent: edit.parent || null };
    const ok = await run(() => (edit._id ? admin.put(`/categories/${edit._id}`, body) : admin.post("/categories", body)), "Category saved");
    if (ok) { setEdit(null); reload(); }
  }
  async function remove() {
    if (!edit?._id || !confirm(`Delete ${edit.name}?`)) return;
    if (await run(() => admin.del(`/categories/${edit._id}`), "Deleted")) { setEdit(null); reload(); }
  }

  const row = (c: Category, child = false) => (
    <li key={c._id}>
      <button onClick={() => setEdit({ ...c, parent: pid(c) })} className={`flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition hover:bg-paper ${child ? "pl-10" : ""}`}>
        <span className="min-w-0"><span className={`block truncate ${child ? "" : "font-semibold"}`}>{c.name}{c.isMedical && <span className="ml-2 font-mono text-[0.65rem] text-ai">MEDICAL</span>}</span>
          <span className="block truncate font-mono text-xs text-faint">/categories/{c.slug}</span></span>
        <span className="shrink-0 font-mono text-xs text-mute">{c.productCount || 0} products</span>
      </button>
    </li>
  );

  return (
    <>
      <PageHeader title="Categories" subtitle="Hierarchical taxonomy. Buyer guidance written here appears on each category page."
        actions={can("catalog:write") && <button onClick={() => setEdit({ name: "", order: 0 })} className={btnPrimary}><Plus className="h-4 w-4" />New category</button>} />
      <StateView loading={loading} error={error} empty={!cats.length}>
        <ul className="divide-y divide-line-2 rounded-2xl border border-line bg-white p-1">
          {top.map((c) => <div key={c._id}>{row(c)}<ul>{cats.filter((x) => pid(x) === c._id).map((x) => row(x, true))}</ul></div>)}
        </ul>
      </StateView>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? `Edit ${edit.name}` : "New category"} wide>
        {edit && (
          <fieldset disabled={!can("catalog:write")} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input className="field" value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Parent">
              <select className="field" value={edit.parent || ""} onChange={(e) => setEdit({ ...edit, parent: e.target.value || null })}>
                <option value="">— Top level —</option>
                {top.filter((c) => c._id !== edit._id).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tagline" className="sm:col-span-2"><input className="field" value={edit.tagline || ""} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} /></Field>
            <Field label="Description" className="sm:col-span-2"><textarea className="field" rows={3} value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <Field label="Buyer guidance" hint="Paragraphs separated by blank lines." className="sm:col-span-2"><textarea className="field" rows={8} value={edit.guide || ""} onChange={(e) => setEdit({ ...edit, guide: e.target.value })} /></Field>
            <Field label="Icon key" hint="zap, gauge, cpu, ruler, heart-pulse…"><input className="field font-mono" value={edit.icon || ""} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} /></Field>
            <Field label="Sort order"><input type="number" className="field" value={edit.order ?? 0} onChange={(e) => setEdit({ ...edit, order: Number(e.target.value) })} /></Field>
            <Field label="SEO title"><input className="field" value={edit.seo?.title || ""} onChange={(e) => setEdit({ ...edit, seo: { ...edit.seo, title: e.target.value } })} /></Field>
            <Field label="SEO description"><input className="field" value={edit.seo?.description || ""} onChange={(e) => setEdit({ ...edit, seo: { ...edit.seo, description: e.target.value } })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(edit.isMedical)} onChange={(e) => setEdit({ ...edit, isMedical: e.target.checked })} />Medical device category</label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              {edit._id && can("catalog:delete") && <button type="button" onClick={remove} className={btnDanger}>Delete</button>}
              <button type="button" onClick={() => setEdit(null)} className={btnGhost}>Cancel</button>
              <button type="button" disabled={busy} onClick={save} className={btnPrimary}>Save</button>
            </div>
          </fieldset>
        )}
      </Modal>
    </>
  );
}
