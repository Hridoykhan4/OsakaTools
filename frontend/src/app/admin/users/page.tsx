"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { admin } from "@/lib/adminApi";
import type { AdminUser } from "@/lib/types";
import { Badge, Field, Modal, PageHeader, Panel, StateView, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "@/components/admin/kit";

const ROLE_HELP: Record<string, string> = {
  owner: "Everything, including users and access.", admin: "Publish, delete, verify documents, commit imports, audit log.",
  editor: "Create and edit products, categories, articles and documents; preview imports.", sales: "Manage inquiries and organizations.", viewer: "Read-only dashboard access.",
};

function ChangePassword() {
  const { run, busy } = useAction();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  return (
    <Panel title="Your password">
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={async (e) => {
        e.preventDefault();
        if (await run(() => admin.post("/auth/password", form), "Password updated")) setForm({ currentPassword: "", newPassword: "" });
      }}>
        <Field label="Current password"><input type="password" autoComplete="current-password" className="field" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></Field>
        <Field label="New password (10+ characters)"><input type="password" autoComplete="new-password" minLength={10} className="field" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></Field>
        <button disabled={busy} className={btnPrimary}>Update</button>
      </form>
    </Panel>
  );
}

export default function Users() {
  const { can, session } = useSession();
  const { run, busy } = useAction();
  const manage = can("users:manage");
  const { data, error, loading, reload } = useLoad(() => (manage ? admin.get<{ users: AdminUser[]; roles: string[] }>("/users") : Promise.resolve({ users: [], roles: [] })), [manage]);
  const [edit, setEdit] = useState<(Partial<AdminUser> & { password?: string }) | null>(null);

  async function save() {
    if (!edit) return;
    if (await run(() => (edit._id ? admin.put(`/users/${edit._id}`, edit) : admin.post("/users", edit)), "Saved")) { setEdit(null); reload(); }
  }

  return (
    <>
      <PageHeader title="Users & access" subtitle="Role-based access. Changing a role, status or password signs that user out everywhere."
        actions={manage && <button onClick={() => setEdit({ username: "", role: "editor", active: true })} className={btnPrimary}><Plus className="h-4 w-4" />Invite user</button>} />
      <div className="space-y-5">
        <ChangePassword />
        {manage ? (
          <StateView loading={loading} error={error}>
            <ul className="divide-y divide-line-2 rounded-2xl border border-line bg-white">
              {data?.users.map((u) => (
                <li key={u._id}>
                  <button onClick={() => setEdit(u)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-paper">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-paper-2 font-semibold uppercase">{u.username[0]}</span>
                    <span className="min-w-0 flex-1"><span className="block font-medium">{u.name || u.username} {u.username === session?.username && <span className="text-xs text-faint">(you)</span>}</span>
                      <span className="block font-mono text-xs text-faint">{u.username} · last sign-in {fmtDate(u.lastLoginAt)}</span></span>
                    <Badge value={u.role} />{!u.active && <Badge value="inactive" />}
                  </button>
                </li>
              ))}
            </ul>
          </StateView>
        ) : <p className="text-sm text-mute">Your role is <b>{session?.role}</b>: {ROLE_HELP[session?.role || "viewer"]}</p>}
        <Panel title="Roles">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">{Object.entries(ROLE_HELP).map(([r, h]) => <div key={r}><dt><Badge value={r} /></dt><dd className="mt-1 text-mute">{h}</dd></div>)}</dl>
        </Panel>
      </div>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? `Edit ${edit.username}` : "New user"}>
        {edit && (
          <div className="space-y-4">
            <Field label="Username"><input className="field font-mono" disabled={Boolean(edit._id)} value={edit.username || ""} onChange={(e) => setEdit({ ...edit, username: e.target.value })} /></Field>
            <Field label="Name"><input className="field" value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Email"><input className="field" type="email" value={edit.email || ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Role" hint={ROLE_HELP[edit.role || "viewer"]}><select className="field" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{data?.roles.map((r) => <option key={r}>{r}</option>)}</select></Field>
            <Field label={edit._id ? "Reset password (optional)" : "Initial password (10+ characters)"}><input className="field" type="password" autoComplete="new-password" value={edit.password || ""} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></Field>
            {edit._id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />Active</label>}
            <div className="flex justify-end gap-2"><button onClick={() => setEdit(null)} className={btnGhost}>Cancel</button><button disabled={busy} onClick={save} className={btnPrimary}>Save</button></div>
          </div>
        )}
      </Modal>
    </>
  );
}
