"use client";

import { useState } from "react";
import { BadgeCheck, Plus } from "lucide-react";
import { admin } from "@/lib/adminApi";
import type { Brand } from "@/lib/types";
import { Badge, Field, Modal, PageHeader, StateView, btnDanger, btnGhost, btnPrimary, useAction, useLoad, useSession } from "@/components/admin/kit";

export default function Brands() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const { data, error, loading, reload } = useLoad(() => admin.get<{ brands: Brand[] }>("/brands"));
  const [edit, setEdit] = useState<Partial<Brand> | null>(null);

  async function save() {
    if (!edit) return;
    if (await run(() => (edit._id ? admin.put(`/brands/${edit._id}`, edit) : admin.post("/brands", edit)), "Saved")) { setEdit(null); reload(); }
  }
  async function remove() {
    if (!edit?._id || !confirm(`Delete ${edit.name}?`)) return;
    if (await run(() => admin.del(`/brands/${edit._id}`), "Deleted")) { setEdit(null); reload(); }
  }

  return (
    <>
      <PageHeader title="Brands & manufacturers" subtitle="Real makers are recorded as manufacturers. The OSAKA TOOL house brand applies only to products with approved private-label evidence."
        actions={can("catalog:write") && <button onClick={() => setEdit({ name: "", kind: "manufacturer" })} className={btnPrimary}><Plus className="h-4 w-4" />New brand</button>} />
      <StateView loading={loading} error={error} empty={!data?.brands.length}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.brands.map((b) => (
            <button key={b._id} onClick={() => setEdit(b)} className="rounded-2xl border border-line bg-white p-5 text-left transition hover:border-ink">
              <div className="flex items-center justify-between"><Badge value={b.kind} />{b.verified && <BadgeCheck className="h-4 w-4 text-ok" aria-label="Verified" />}</div>
              <p className="mt-3 text-lg font-semibold">{b.name}</p>
              <p className="text-sm text-mute">{[b.country, `${b.productCount || 0} products`].filter(Boolean).join(" · ")}</p>
            </button>
          ))}
        </div>
      </StateView>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? `Edit ${edit.name}` : "New brand"}>
        {edit && (
          <fieldset disabled={!can("catalog:write")} className="space-y-4">
            <Field label="Name"><input className="field" value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Type">
              <select className="field" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as Brand["kind"] })}>
                <option value="manufacturer">Manufacturer</option><option value="distributor">Distributor</option><option value="house">House brand</option>
              </select>
            </Field>
            <Field label="Country"><input className="field" value={edit.country || ""} onChange={(e) => setEdit({ ...edit, country: e.target.value })} /></Field>
            <Field label="Website"><input className="field" value={edit.website || ""} onChange={(e) => setEdit({ ...edit, website: e.target.value })} /></Field>
            <Field label="Description"><textarea className="field" rows={3} value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            {can("documents:verify") && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(edit.verified)} onChange={(e) => setEdit({ ...edit, verified: e.target.checked })} />Brand details verified</label>}
            <div className="flex justify-end gap-2">
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
