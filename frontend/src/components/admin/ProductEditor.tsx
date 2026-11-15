"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, FileText, ImagePlus, Plus, Sparkles, Trash2, Upload, XCircle } from "lucide-react";
import { admin, uploadFiles } from "@/lib/adminApi";
import type { AuditEntry, Brand, Category, CompanyDocument, Market, Product, Spec } from "@/lib/types";
import { Badge, Field, Panel, btnDanger, btnGhost, btnPrimary, fmtDate, useAction, useLoad, useSession } from "./kit";

type Draft = Omit<Product, "_id" | "category" | "brand" | "slug" | "updatedAt" | "published"> & { category: string; brand: string; slug?: string };

const EMPTY: Draft = {
  name: "", shortDescription: "", description: "", category: "", brand: "", manufacturer: "", modelNumber: "", sku: "", gtin: "",
  countryOfOrigin: "", originVerified: false, privateLabel: { status: "none", evidence: null }, images: [], specifications: [], features: [],
  applications: [], inBox: [], documents: [], certifications: [], warranty: "", moq: 1, leadTime: "", regions: [],
  regulatory: { isMedical: false, deviceClass: "", intendedUse: "", markets: [] }, seo: { title: "", description: "", canonical: "", noindex: false },
  status: "draft", featured: false, reviewNotes: [],
};

const TABS = ["Basics", "Specifications", "Media & documents", "Compliance", "SEO", "Publishing", "History"] as const;
const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

function toDraft(p: Product): Draft {
  return { ...EMPTY, ...p, category: typeof p.category === "object" ? p.category._id : p.category,
    brand: p.brand && typeof p.brand === "object" ? p.brand._id : (p.brand as string) || "",
    regulatory: { ...EMPTY.regulatory!, ...p.regulatory }, seo: { ...EMPTY.seo, ...p.seo }, privateLabel: { ...EMPTY.privateLabel!, ...p.privateLabel } };
}

// Deterministic completeness checks. They flag gaps; they never invent data.
function checks(d: Draft) {
  const items: [boolean, string][] = [
    [Boolean(d.name && d.category), "Name and category"],
    [Boolean(d.manufacturer), "Manufacturer stated"],
    [Boolean(d.modelNumber || d.sku), "Model number or SKU"],
    [d.images.length > 0, "At least one image"],
    [d.images.every((i) => i.alt), "Alt text on every image"],
    [d.specifications.length >= 3, "Three or more specifications"],
    [d.specifications.some((s) => s.filterable), "At least one filterable specification"],
    [Boolean(d.shortDescription), "Short description"],
    [d.documents.length > 0, "Datasheet or manual attached"],
    [!d.countryOfOrigin || Boolean(d.originVerified), "Origin claim verified (or left blank)"],
    [Boolean(d.seo?.description), "SEO description"],
  ];
  if (d.regulatory?.isMedical) items.push([d.regulatory.markets.some((m) => m.status === "registered" && m.evidence), "Medical: registered market with evidence"]);
  return items;
}

export default function ProductEditor({ product }: { product?: Product }) {
  const router = useRouter();
  const { can } = useSession();
  const { run, busy } = useAction();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Basics");
  const [d, setD] = useState<Draft>(product ? toDraft(product) : EMPTY);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const cats = useLoad(() => admin.get<{ categories: Category[] }>("/categories"));
  const brands = useLoad(() => admin.get<{ brands: Brand[] }>("/brands"));
  const docs = useLoad(() => admin.get<{ documents: CompanyDocument[] }>("/documents"));
  const history = useLoad(() => (product ? admin.get<{ logs: AuditEntry[] }>(`/products/id/${product._id}/history`) : Promise.resolve({ logs: [] })), [product?._id]);
  const verifiedDocs = (docs.data?.documents || []).filter((x) => x.status === "verified");
  const report = useMemo(() => checks(d), [d]);
  const score = Math.round((report.filter(([ok]) => ok).length / report.length) * 100);

  async function save(status?: Draft["status"]) {
    const body = { ...d, ...(status ? { status } : {}), brand: d.brand || null };
    const r = await run(() => (product ? admin.put<{ product: Product }>(`/products/${product._id}`, body) : admin.post<{ product: Product }>("/products", body)),
      status === "published" ? "Published" : "Saved");
    if (r) {
      setD(toDraft(r.product));
      history.reload();
      if (!product) router.replace(`/admin/products/${r.product._id}`);
    }
  }

  async function remove() {
    if (!product || !confirm(`Delete “${product.name}” permanently?`)) return;
    if (await run(() => admin.del(`/products/${product._id}`), "Deleted")) router.replace("/admin/products");
  }

  async function onUpload(files: FileList | null, kind: "image" | "document") {
    if (!files?.length) return;
    setUploading(true);
    const r = await run(() => uploadFiles(files), "Uploaded");
    setUploading(false);
    if (!r) return;
    const imgs = r.files.filter((f) => f.kind === "image").map((f) => ({ url: f.url, publicId: f.publicId, alt: d.name }));
    const pdfs = r.files.filter((f) => f.kind === "document").map((f) => ({ title: f.name.replace(/\.pdf$/i, ""), kind: "datasheet", url: f.url, publicId: f.publicId, public: true }));
    if (kind === "image" || imgs.length) set("images", [...d.images, ...imgs]);
    if (pdfs.length) set("documents", [...d.documents, ...pdfs]);
  }

  function seoFromData() {
    const title = [d.manufacturer, d.modelNumber, d.name.replace(d.modelNumber, "").trim()].filter(Boolean).join(" ").slice(0, 70);
    const specs = d.specifications.slice(0, 3).map((s) => `${s.label.toLowerCase()} ${s.value}${s.unit ? ` ${s.unit}` : ""}`).join(", ");
    const desc = `${d.name} by ${d.manufacturer || "the manufacturer"}${specs ? `: ${specs}` : ""}. Specifications, documents and quotations from OSAKA TOOL.`;
    set("seo", { ...d.seo, title, description: desc.slice(0, 160) });
  }

  function moveSpec(i: number, dir: -1 | 1) {
    const s = [...d.specifications]; const j = i + dir;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]]; set("specifications", s);
  }
  function pasteSpecs() {
    const text = prompt("Paste specifications, one per line, as “Label: Value” or “Group | Label | Value | Unit”");
    if (!text) return;
    const parsed: Spec[] = lines(text).map((l) => {
      if (l.includes("|")) { const [group, label, value, unit = ""] = l.split("|").map((x) => x.trim()); return { group, label, value, unit, filterable: false }; }
      const [label, ...rest] = l.split(/[:\t]/); return { group: "General", label: label.trim(), value: rest.join(":").trim(), unit: "", filterable: false };
    }).filter((s) => s.label && s.value);
    set("specifications", [...d.specifications, ...parsed]);
  }
  const updateMarket = (i: number, patch: Partial<Market>) =>
    set("regulatory", { ...d.regulatory!, markets: d.regulatory!.markets.map((m, j) => (j === i ? { ...m, ...patch } : m)) });

  const readOnly = !can("catalog:write");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2"><Badge value={d.status} />{d.featured && <Badge value="featured">featured</Badge>}{product?.source?.system && product.source.system !== "manual" && <Badge value="source">via {product.source.system}</Badge>}</p>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl">{d.name || "New product"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {product?.status === "published" && <a href={`/products/${product.slug}`} target="_blank" className={btnGhost}><ExternalLink className="h-4 w-4" />View</a>}
          {product && can("catalog:delete") && <button onClick={remove} className={btnDanger}><Trash2 className="h-4 w-4" />Delete</button>}
          {!readOnly && <button disabled={busy} onClick={() => save()} className={btnGhost}>Save</button>}
          {!readOnly && d.status !== "published" && <button disabled={busy} onClick={() => save(can("catalog:publish") ? "published" : "review")} className={btnPrimary}>{can("catalog:publish") ? "Publish" : "Submit for review"}</button>}
        </div>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist">
        {TABS.filter((t) => t !== "History" || product).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm ${tab === t ? "border-beni font-medium text-ink" : "border-transparent text-mute hover:text-ink"}`}>{t}</button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <fieldset disabled={readOnly} className="min-w-0 space-y-5 lg:col-span-8">
          {tab === "Basics" && (
            <Panel>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name *" className="sm:col-span-2"><input className="field" value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={240} /></Field>
                <Field label="Category *">
                  <select className="field" value={d.category} onChange={(e) => set("category", e.target.value)}>
                    <option value="">Choose…</option>
                    {cats.data?.categories.map((c) => <option key={c._id} value={c._id}>{c.parent ? "— " : ""}{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Brand record" hint="The brand shown to buyers. OSAKA TOOL house brand requires approved private-label evidence.">
                  <select className="field" value={d.brand} onChange={(e) => set("brand", e.target.value)}>
                    <option value="">None</option>
                    {brands.data?.brands.map((b) => <option key={b._id} value={b._id}>{b.name} ({b.kind})</option>)}
                  </select>
                </Field>
                <Field label="Manufacturer *" hint="The company that actually makes the product."><input className="field" value={d.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} /></Field>
                <Field label="Model number"><input className="field font-mono" value={d.modelNumber} onChange={(e) => set("modelNumber", e.target.value)} /></Field>
                <Field label="SKU"><input className="field font-mono" value={d.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
                <Field label="GTIN / EAN"><input className="field font-mono" value={d.gtin} onChange={(e) => set("gtin", e.target.value)} inputMode="numeric" /></Field>
                <Field label="Short description" className="sm:col-span-2"><textarea className="field" rows={2} maxLength={500} value={d.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></Field>
                <Field label="Full description" hint="Supports “## Heading” and “- bullet” lines." className="sm:col-span-2"><textarea className="field font-mono text-sm" rows={8} value={d.description} onChange={(e) => set("description", e.target.value)} /></Field>
                <Field label="Features (one per line)"><textarea className="field" rows={5} value={d.features.join("\n")} onChange={(e) => set("features", lines(e.target.value))} /></Field>
                <Field label="Applications (one per line)"><textarea className="field" rows={5} value={d.applications.join("\n")} onChange={(e) => set("applications", lines(e.target.value))} /></Field>
                <Field label="In the box (one per line)"><textarea className="field" rows={4} value={d.inBox.join("\n")} onChange={(e) => set("inBox", lines(e.target.value))} /></Field>
                <div className="grid gap-4">
                  <Field label="Warranty"><input className="field" value={d.warranty} onChange={(e) => set("warranty", e.target.value)} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="MOQ"><input className="field" type="number" min={1} value={d.moq} onChange={(e) => set("moq", Number(e.target.value) || 1)} /></Field>
                    <Field label="Lead time"><input className="field" value={d.leadTime} onChange={(e) => set("leadTime", e.target.value)} placeholder="e.g. 2–3 weeks" /></Field>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {tab === "Specifications" && (
            <Panel title={`Specifications (${d.specifications.length})`} actions={<div className="flex gap-2"><button type="button" onClick={pasteSpecs} className={btnGhost}>Paste table</button>
              <button type="button" onClick={() => set("specifications", [...d.specifications, { group: "General", label: "", value: "", unit: "", filterable: false }])} className={btnPrimary}><Plus className="h-4 w-4" />Add</button></div>}>
              <p className="mb-4 text-xs text-mute">“Filter” makes a specification a catalogue facet. Use consistent labels and units across products, such as “Maximum pressure” in PSI.</p>
              <div className="space-y-2">
                {d.specifications.map((s, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-line-2 p-2 sm:grid-cols-[8rem_1fr_1fr_5rem_auto]">
                    <input className="field !min-h-9 text-sm" placeholder="Group" value={s.group} onChange={(e) => set("specifications", d.specifications.map((x, j) => (j === i ? { ...x, group: e.target.value } : x)))} />
                    <input className="field !min-h-9 text-sm" placeholder="Label" value={s.label} onChange={(e) => set("specifications", d.specifications.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                    <input className="field !min-h-9 font-mono text-sm" placeholder="Value" value={s.value} onChange={(e) => set("specifications", d.specifications.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                    <input className="field !min-h-9 font-mono text-sm" placeholder="Unit" value={s.unit} onChange={(e) => set("specifications", d.specifications.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} />
                    <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
                      <label className="mr-1 flex items-center gap-1 text-xs"><input type="checkbox" checked={Boolean(s.filterable)} onChange={(e) => set("specifications", d.specifications.map((x, j) => (j === i ? { ...x, filterable: e.target.checked } : x)))} />Filter</label>
                      <button type="button" onClick={() => moveSpec(i, -1)} className="rounded p-1.5 hover:bg-paper-2" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => moveSpec(i, 1)} className="rounded p-1.5 hover:bg-paper-2" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => set("specifications", d.specifications.filter((_, j) => j !== i))} className="rounded p-1.5 text-beni hover:bg-beni-soft" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                {!d.specifications.length && <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-mute">No specifications yet. Add rows or paste a table from a datasheet.</p>}
              </div>
            </Panel>
          )}

          {tab === "Media & documents" && (
            <>
              <Panel title={`Images (${d.images.length})`} actions={
                <label className={`${btnPrimary} cursor-pointer`}><ImagePlus className="h-4 w-4" />{uploading ? "Uploading…" : "Upload"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => onUpload(e.target.files, "image")} /></label>}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {d.images.map((img, i) => (
                    <div key={img.url} className="rounded-xl border border-line-2 p-2">
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-paper"><Image src={img.url} alt={img.alt || ""} fill sizes="200px" className="object-contain p-2" /></div>
                      <input className="field mt-2 !min-h-8 text-xs" placeholder="Alt text" value={img.alt || ""} onChange={(e) => set("images", d.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />
                      <div className="mt-1 flex justify-between">
                        <button type="button" disabled={i === 0} onClick={() => set("images", [img, ...d.images.filter((_, j) => j !== i)])} className="text-xs text-mute hover:text-ink disabled:opacity-40">{i === 0 ? "Primary" : "Make primary"}</button>
                        <button type="button" onClick={() => set("images", d.images.filter((_, j) => j !== i))} className="text-xs text-beni">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title={`Documents (${d.documents.length})`} actions={
                <label className={`${btnGhost} cursor-pointer`}><Upload className="h-4 w-4" />Upload PDF
                  <input type="file" accept="application/pdf" multiple className="sr-only" onChange={(e) => onUpload(e.target.files, "document")} /></label>}>
                <ul className="space-y-2">
                  {d.documents.map((doc, i) => (
                    <li key={doc.url} className="grid items-center gap-2 rounded-xl border border-line-2 p-2 sm:grid-cols-[auto_1fr_9rem_auto_auto]">
                      <FileText className="hidden h-5 w-5 text-beni sm:block" />
                      <input className="field !min-h-9 text-sm" value={doc.title} onChange={(e) => set("documents", d.documents.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                      <select className="field !min-h-9 text-sm" value={doc.kind} onChange={(e) => set("documents", d.documents.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))}>
                        {["datasheet", "manual", "certificate", "test-report", "regulatory", "other"].map((k) => <option key={k}>{k}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={doc.public !== false} onChange={(e) => set("documents", d.documents.map((x, j) => (j === i ? { ...x, public: e.target.checked } : x)))} />Public</label>
                      <button type="button" onClick={() => set("documents", d.documents.filter((_, j) => j !== i))} className="text-xs text-beni">Remove</button>
                    </li>
                  ))}
                  {!d.documents.length && <li className="text-sm text-mute">No datasheets or manuals attached.</li>}
                </ul>
              </Panel>
            </>
          )}

          {tab === "Compliance" && (
            <>
              <Panel title="Origin & branding">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Country of origin" hint="Shown publicly only when verified."><input className="field" value={d.countryOfOrigin} onChange={(e) => set("countryOfOrigin", e.target.value)} /></Field>
                  <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={Boolean(d.originVerified)} disabled={!can("documents:verify")} onChange={(e) => set("originVerified", e.target.checked)} />Origin verified against supplier documents</label>
                  <Field label="Private label (OSAKA TOOL branding)">
                    <select className="field" value={d.privateLabel?.status} onChange={(e) => set("privateLabel", { ...d.privateLabel!, status: e.target.value as "none" })}>
                      <option value="none">Not private-labelled (sold under the maker&apos;s brand)</option>
                      <option value="pending">Pending documentation</option>
                      <option value="approved" disabled={!can("documents:verify")}>Approved</option>
                    </select>
                  </Field>
                  <Field label="Private-label evidence" hint="Manufacturing or OEM agreement, verified.">
                    <select className="field" value={d.privateLabel?.evidence || ""} onChange={(e) => set("privateLabel", { ...d.privateLabel!, evidence: e.target.value || null })}>
                      <option value="">None</option>
                      {verifiedDocs.map((x) => <option key={x._id} value={x._id}>{x.title}</option>)}
                    </select>
                  </Field>
                  <Field label="Declared conformity marks (one per line)" hint="Only marks backed by a certificate document." className="sm:col-span-2">
                    <textarea className="field" rows={3} value={d.certifications.join("\n")} onChange={(e) => set("certifications", lines(e.target.value))} />
                  </Field>
                </div>
              </Panel>
              <Panel title="Medical device regulation">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(d.regulatory?.isMedical)} onChange={(e) => set("regulatory", { ...d.regulatory!, isMedical: e.target.checked })} />This product is a medical device</label>
                {d.regulatory?.isMedical && (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Device class"><input className="field" value={d.regulatory.deviceClass} onChange={(e) => set("regulatory", { ...d.regulatory!, deviceClass: e.target.value })} placeholder="e.g. IIa (EU MDR)" /></Field>
                      <Field label="Intended use" className="sm:col-span-2"><textarea className="field" rows={2} value={d.regulatory.intendedUse} onChange={(e) => set("regulatory", { ...d.regulatory!, intendedUse: e.target.value })} /></Field>
                    </div>
                    <p className="text-sm font-medium">Market eligibility</p>
                    {d.regulatory.markets.map((m, i) => (
                      <div key={i} className="grid gap-2 rounded-xl border border-line-2 p-2 sm:grid-cols-[1fr_1fr_1fr_9rem_1fr_auto]">
                        <input className="field !min-h-9 text-sm" placeholder="Region" value={m.region} onChange={(e) => updateMarket(i, { region: e.target.value })} />
                        <input className="field !min-h-9 text-sm" placeholder="Authority" value={m.authority} onChange={(e) => updateMarket(i, { authority: e.target.value })} />
                        <input className="field !min-h-9 font-mono text-sm" placeholder="Registration no." value={m.registrationNo} onChange={(e) => updateMarket(i, { registrationNo: e.target.value })} />
                        <select className="field !min-h-9 text-sm" value={m.status} onChange={(e) => updateMarket(i, { status: e.target.value as Market["status"] })}>
                          {["pending", "registered", "not-eligible", "not-applicable"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <select className="field !min-h-9 text-sm" value={m.evidence || ""} onChange={(e) => updateMarket(i, { evidence: e.target.value || null })}>
                          <option value="">Evidence…</option>
                          {verifiedDocs.map((x) => <option key={x._id} value={x._id}>{x.title}</option>)}
                        </select>
                        <button type="button" onClick={() => set("regulatory", { ...d.regulatory!, markets: d.regulatory!.markets.filter((_, j) => j !== i) })} className="text-xs text-beni">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => set("regulatory", { ...d.regulatory!, markets: [...d.regulatory!.markets, { region: "", authority: "", registrationNo: "", status: "pending", evidence: null }] })} className={btnGhost}><Plus className="h-4 w-4" />Add market</button>
                  </div>
                )}
              </Panel>
            </>
          )}

          {tab === "SEO" && (
            <Panel title="Search appearance" actions={<button type="button" onClick={seoFromData} className={btnGhost}><Sparkles className="h-4 w-4" />Draft from product data</button>}>
              <div className="space-y-4">
                <Field label={`SEO title (${d.seo?.title?.length || 0}/60)`} hint="Defaults to manufacturer + product name."><input className="field" maxLength={120} value={d.seo?.title} onChange={(e) => set("seo", { ...d.seo, title: e.target.value })} /></Field>
                <Field label={`Meta description (${d.seo?.description?.length || 0}/160)`}><textarea className="field" rows={3} maxLength={320} value={d.seo?.description} onChange={(e) => set("seo", { ...d.seo, description: e.target.value })} /></Field>
                <Field label="Canonical URL override" hint="Leave empty to use the product URL."><input className="field font-mono text-sm" value={d.seo?.canonical} onChange={(e) => set("seo", { ...d.seo, canonical: e.target.value })} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(d.seo?.noindex)} onChange={(e) => set("seo", { ...d.seo, noindex: e.target.checked })} />Exclude from search engines (noindex)</label>
                <div className="rounded-xl border border-line p-4">
                  <p className="font-mono text-xs text-ok">osakatool.com › products › {product?.slug || "new-product"}</p>
                  <p className="mt-1 truncate text-lg text-ai">{(d.seo?.title || `${d.manufacturer} ${d.name}`).trim()} | OSAKA TOOL</p>
                  <p className="line-clamp-2 text-sm text-mute">{d.seo?.description || d.shortDescription}</p>
                </div>
              </div>
            </Panel>
          )}

          {tab === "Publishing" && (
            <Panel title="Publication">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Status">
                  <select className="field" value={d.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
                    <option value="draft">Draft</option><option value="review">In review</option>
                    <option value="published" disabled={!can("catalog:publish")}>Published</option><option value="archived">Archived</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} />Feature on the homepage</label>
                <Field label="Regions supplied (one per line)" className="sm:col-span-2"><textarea className="field" rows={3} value={d.regions.join("\n")} onChange={(e) => set("regions", lines(e.target.value))} /></Field>
                <Field label="Internal review notes (one per line)" className="sm:col-span-2"><textarea className="field" rows={4} value={(d.reviewNotes || []).join("\n")} onChange={(e) => set("reviewNotes", lines(e.target.value))} /></Field>
              </div>
              <p className="mt-4 text-xs text-mute">Save changes to apply the status. Publishing is blocked until images, manufacturer, a description and any required medical or private-label evidence are in place.</p>
            </Panel>
          )}

          {tab === "History" && product && (
            <Panel title="Change history">
              <ul className="space-y-4">
                {history.data?.logs.map((l) => (
                  <li key={l._id} className="border-l-2 border-line pl-4">
                    <p className="text-sm"><b className="font-medium">{l.actor}</b> <span className="text-mute">{l.summary}</span></p>
                    <p className="font-mono text-xs text-faint">{fmtDate(l.createdAt)}</p>
                    {l.changes && <p className="mt-1 font-mono text-xs text-mute">Changed: {Object.keys(l.changes).join(", ")}</p>}
                  </li>
                ))}
                {!history.data?.logs.length && <li className="text-sm text-mute">No recorded changes.</li>}
              </ul>
            </Panel>
          )}
        </fieldset>

        <aside className="space-y-5 lg:col-span-4">
          <Panel title={`Listing quality · ${score}%`}>
            <div className="mb-4 h-1.5 rounded-full bg-paper-2"><div className={`h-full rounded-full ${score >= 80 ? "bg-ok" : score >= 50 ? "bg-warn" : "bg-beni"}`} style={{ width: `${score}%` }} /></div>
            <ul className="space-y-1.5 text-sm">
              {report.map(([ok, label]) => (
                <li key={label} className="flex items-center gap-2">{ok ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <XCircle className="h-4 w-4 text-faint" />}<span className={ok ? "" : "text-mute"}>{label}</span></li>
              ))}
            </ul>
          </Panel>
          {product?.source?.system && product.source.system !== "manual" && (
            <Panel title="Import provenance">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-mute">Source</dt><dd className="font-mono">{product.source.system}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mute">Source ID</dt><dd className="truncate font-mono text-xs">{product.source.sourceId}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mute">Imported</dt><dd className="text-xs">{fmtDate(product.source.importedAt)}</dd></div>
              </dl>
              {product.source.url && <a href={product.source.url} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 text-sm text-beni">Open source listing <ExternalLink className="h-3.5 w-3.5" /></a>}
            </Panel>
          )}
          {(d.reviewNotes || []).length > 0 && (
            <Panel title="Review notes">
              <ul className="space-y-2 text-sm text-mute">{d.reviewNotes!.map((n) => <li key={n}>• {n}</li>)}</ul>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
