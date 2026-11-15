import Link from "next/link";
import Image from "next/image";
import { Empty, PageHero } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import type { Product } from "@/lib/types";

export const metadata = pageMetadata("/compare", "Compare products", "Compare OSAKA TOOL products side by side by specification.", { noindex: true });

const BASE = process.env.API_INTERNAL_URL || "http://localhost:5000/api";

export default async function Compare({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const slugs = ((await searchParams).p || "").split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9-]{1,140}$/.test(s)).slice(0, 4);
  let products: Product[] = [];
  if (slugs.length) {
    const res = await fetch(`${BASE}/products/compare?slugs=${slugs.join(",")}`, { cache: "no-store" }).catch(() => null);
    if (res?.ok) products = (await res.json()).products;
  }
  const labels = [...new Set(products.flatMap((p) => p.specifications.map((s) => s.label)))];
  const rows: [string, (p: Product) => string][] = [
    ["Manufacturer", (p) => p.manufacturer], ["Model", (p) => p.modelNumber], ["SKU", (p) => p.sku],
    ["Category", (p) => (typeof p.category === "object" ? p.category.name : "")], ["Warranty", (p) => p.warranty || ""],
    ...labels.map((l) => [l, (p: Product) => { const s = p.specifications.find((x) => x.label === l); return s ? `${s.value}${s.unit ? ` ${s.unit}` : ""}` : "—"; }] as [string, (p: Product) => string]),
  ];

  return (
    <>
      <PageHero eyebrow="Side by side" title="Compare products" crumbs={[{ name: "Compare", path: "/compare" }]} intro="Select up to four products from the catalogue to compare their specifications." />
      <div className="shell mt-12">
        {products.length < 2 ? (
          <Empty title="Choose at least two products" text="Use the compare button on any product card or product page. Your selection appears in the bar at the bottom of the screen." action={{ href: "/products", label: "Browse products" }} />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 w-48 bg-white p-5 text-left align-bottom font-mono text-xs uppercase tracking-[0.12em] text-faint">Specification</th>
                  {products.map((p) => (
                    <th key={p._id} className="p-5 text-left align-top font-normal">
                      <div className="relative mb-3 h-28 w-full">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="200px" className="object-contain" />}</div>
                      <Link href={`/products/${p.slug}`} className="font-semibold hover:text-beni">{p.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(([label, get]) => {
                  const values = products.map(get);
                  const differs = new Set(values).size > 1;
                  return (
                    <tr key={label} className={differs ? "bg-beni-soft/40" : ""}>
                      <th scope="row" className="sticky left-0 bg-inherit p-4 pl-5 text-left font-medium text-mute">{label}</th>
                      {values.map((v, i) => <td key={i} className="p-4 font-mono">{v || "—"}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {products.length >= 2 && <p className="mt-4 text-xs text-faint">Highlighted rows differ between the selected products.</p>}
      </div>
    </>
  );
}
