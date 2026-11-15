"use client";

import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { admin } from "@/lib/adminApi";
import type { Article } from "@/lib/types";
import { Badge, Field, Modal, PageHeader, StateView, btnDanger, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "@/components/admin/kit";

const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

export default function Articles() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const { data, error, loading, reload } = useLoad(() => admin.get<{ posts: Article[] }>("/articles?limit=50"));
  const [edit, setEdit] = useState<Partial<Article> | null>(null);

  async function open(a: Article) {
    const r = await run(() => admin.get<{ post: Article }>(`/articles/${a.slug}`));
    if (r) setEdit(r.post);
  }
  async function save() {
    if (!edit) return;
    if (await run(() => (edit._id ? admin.put(`/articles/${edit._id}`, edit) : admin.post("/articles", edit)), "Saved")) { setEdit(null); reload(); }
  }
  async function remove() {
    if (!edit?._id || !confirm("Delete this article?")) return;
    if (await run(() => admin.del(`/articles/${edit._id}`), "Deleted")) { setEdit(null); reload(); }
  }

  return (
    <>
      <PageHeader title="Articles" subtitle="Technical resources published under /resources. Write original, accurate guidance; cite standards by number."
        actions={can("content:write") && <button onClick={() => setEdit({ title: "", content: "", category: "Guides", published: false, tags: [], relatedCategories: [] })} className={btnPrimary}><Plus className="h-4 w-4" />New article</button>} />
      <StateView loading={loading} error={error} empty={!data?.posts.length}>
        <ul className="divide-y divide-line-2 rounded-2xl border border-line bg-white">
          {data?.posts.map((a) => (
            <li key={a._id} className="flex items-center gap-3 p-4">
              <button onClick={() => open(a)} className="min-w-0 flex-1 text-left">
                <span className="block truncate font-medium hover:text-beni">{a.title}</span>
                <span className="block font-mono text-xs text-faint">{a.category} · {a.readingMinutes} min · {fmtDate(a.publishedAt)}</span>
              </button>
              <Badge value={a.published ? "published" : "draft"} />
              {a.published && <a href={`/resources/${a.slug}`} target="_blank" aria-label="View" className="text-faint hover:text-ink"><ExternalLink className="h-4 w-4" /></a>}
            </li>
          ))}
        </ul>
      </StateView>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? "Edit article" : "New article"} wide>
        {edit && (
          <fieldset disabled={!can("content:write")} className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2"><input className="field" value={edit.title || ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Category"><input className="field" value={edit.category || ""} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field>
            <Field label="Author"><input className="field" value={edit.author || ""} onChange={(e) => setEdit({ ...edit, author: e.target.value })} /></Field>
            <Field label="Excerpt" className="sm:col-span-2"><textarea className="field" rows={2} value={edit.excerpt || ""} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} /></Field>
            <Field label="Content" hint="## Heading, - bullet, **bold**, blank line between paragraphs" className="sm:col-span-2">
              <textarea className="field font-mono text-sm" rows={16} value={edit.content || ""} onChange={(e) => setEdit({ ...edit, content: e.target.value })} />
            </Field>
            <Field label="Tags (comma separated)"><input className="field" value={(edit.tags || []).join(", ")} onChange={(e) => setEdit({ ...edit, tags: list(e.target.value) })} /></Field>
            <Field label="Related category slugs (comma separated)"><input className="field font-mono text-sm" value={(edit.relatedCategories || []).join(", ")} onChange={(e) => setEdit({ ...edit, relatedCategories: list(e.target.value) })} /></Field>
            <Field label="SEO title"><input className="field" value={edit.seo?.title || ""} onChange={(e) => setEdit({ ...edit, seo: { ...edit.seo, title: e.target.value } })} /></Field>
            <Field label="SEO description"><input className="field" value={edit.seo?.description || ""} onChange={(e) => setEdit({ ...edit, seo: { ...edit.seo, description: e.target.value } })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(edit.published)} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} />Published</label>
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
