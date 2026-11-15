"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { admin } from "@/lib/adminApi";
import type { Category, SiteSettings } from "@/lib/types";
import { Field, PageHeader, Panel, StateView, btnGhost, btnPrimary, useAction, useLoad, useSession } from "@/components/admin/kit";

type Section = keyof SiteSettings;

export default function SettingsPage() {
  const { can } = useSession();
  const { run, busy } = useAction();
  const { data, error, loading, reload } = useLoad(() => Promise.all([
    admin.get<{ settings: SiteSettings }>("/settings"), admin.get<{ categories: Category[] }>("/categories"),
  ]));
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [loadedFrom, setLoadedFrom] = useState<unknown>(null);
  // Re-seed the form whenever a fresh copy arrives from the API.
  if (data && data !== loadedFrom) { setLoadedFrom(data); setDraft(data[0].settings); }

  const editable = can("settings:manage");
  const set = <S extends Section>(section: S, field: keyof SiteSettings[S], value: unknown) =>
    setDraft((d) => (d ? { ...d, [section]: { ...d[section], [field]: value } } : d));

  async function save() {
    if (draft && await run(() => admin.put("/settings", draft), "Settings saved")) reload();
  }

  const categories = data?.[1].categories || [];
  const featured = draft?.home.featuredCategories || [];
  const move = (i: number, dir: number) => {
    const next = [...featured]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; set("home", "featuredCategories", next);
  };

  const text = (section: Section, field: string, label: string, hint?: string, rows = 0) => {
    const value = String((draft?.[section] as Record<string, unknown>)?.[field] ?? "");
    return (
      <Field label={label} hint={hint}>
        {rows ? <textarea className="field" rows={rows} value={value} onChange={(e) => set(section, field as never, e.target.value)} />
          : <input className="field" value={value} onChange={(e) => set(section, field as never, e.target.value)} />}
      </Field>
    );
  };

  return (
    <>
      <PageHeader title="Site settings" subtitle="Homepage copy, announcement bar, contact channels, social links and homepage curation. Changes appear on the website within 30 seconds."
        actions={editable && <button disabled={busy || !draft} onClick={save} className={btnPrimary}>Save settings</button>} />
      <StateView loading={loading} error={error}>
        {draft && (
          <fieldset disabled={!editable} className="grid gap-6 xl:grid-cols-2">
            <Panel title="Homepage hero">
              <div className="space-y-4">
                {text("hero", "kicker", "Line above the headline", "Leave empty to use the default.")}
                {text("hero", "title", "Headline", "Use a line break-free sentence. Default: Precision, from Osaka to the world.")}
                {text("hero", "subtitle", "Introduction", undefined, 3)}
                {text("hero", "kanji", "Vertical kanji", "Up to 8 characters, shown vertically beside the headline. Default: 大阪精密")}
                {text("home", "statement", "Brand statement", "Shown in the large statement section.", 3)}
              </div>
            </Panel>
            <Panel title="Announcement bar">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.announcement.active} onChange={(e) => set("announcement", "active", e.target.checked)} />Show the announcement bar</label>
                {text("announcement", "text", "Message")}
                {text("announcement", "href", "Link", "A site path such as /rfq or a full https:// URL.")}
              </div>
            </Panel>
            <Panel title="Contact channels">
              <div className="grid gap-4 sm:grid-cols-2">
                {text("contact", "email", "Sales email")}
                {text("contact", "phone", "Phone")}
                {text("contact", "whatsapp", "WhatsApp number", "International format, e.g. +971500000000")}
                {text("contact", "hours", "Business hours")}
                <div className="sm:col-span-2">{text("contact", "address", "Address", undefined, 2)}</div>
              </div>
            </Panel>
            <Panel title="Social links">
              <div className="grid gap-4 sm:grid-cols-2">
                {text("social", "linkedin", "LinkedIn")}{text("social", "facebook", "Facebook")}
                {text("social", "instagram", "Instagram")}{text("social", "youtube", "YouTube")}{text("social", "x", "X")}
              </div>
            </Panel>
            <Panel title="Homepage product families" className="xl:col-span-2">
              <p className="text-sm text-mute">Choose and order the families shown in the homepage scroll. Leave empty to show every top-level family.</p>
              <ol className="mt-4 space-y-2">
                {featured.map((slug, i) => (
                  <li key={slug} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm">
                    <span className="w-6 text-faint">{i + 1}</span>
                    <span className="flex-1">{categories.find((c) => c.slug === slug)?.name || slug}</span>
                    <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className={btnGhost}><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className={btnGhost}><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Remove" onClick={() => set("home", "featuredCategories", featured.filter((s) => s !== slug))} className={btnGhost}><X className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ol>
              <select className="field mt-3 max-w-md" value="" onChange={(e) => e.target.value && set("home", "featuredCategories", [...featured, e.target.value])}>
                <option value="">Add a family…</option>
                {categories.filter((c) => !featured.includes(c.slug)).map((c) => <option key={c._id} value={c.slug}>{c.parent ? "— " : ""}{c.name}</option>)}
              </select>
            </Panel>
          </fieldset>
        )}
      </StateView>
    </>
  );
}
