import "server-only";
import { api, safe } from "./api";
import { cld, trimmed } from "./media";
import type { Product } from "./types";

// Homepage art direction: products are chosen for the quality of their photography
// and their data, not for how many items a category happens to contain.
export const HERO_PARTS = [
  { slug: "british-flanged-swing-check-valve", label: "Swing check valve", x: 47, y: 40, w: 31, depth: 0.55 },
  { slug: "k140-esfr-pendent-sprinkler", label: "ESFR pendent sprinkler", x: 84, y: 26, w: 14, depth: 1.1 },
  { slug: "brass-filtering-reducing-valve", label: "Filtering reducing valve", x: 74, y: 70, w: 21, depth: 0.8 },
  { slug: "selectable-gallonage-handline-fire-nozzle-brass", label: "Selectable handline nozzle", x: 17, y: 62, w: 29, depth: 0.45 },
  { slug: "machino-exchange-adapter", label: "Exchange adapter", x: 92, y: 84, w: 11, depth: 1.3 },
] as const;

export const DETAIL_SLUG = "nova-tech-ref-3670-portable-air-compressor-80w";
// The source image is a marketing composite; this crop isolates the instrument itself.
export const DETAIL_CROP = "c_crop,x_345,y_110,w_300,h_600";

export const SELECTED_SLUGS = [
  "k56-dry-standard-response-sprinkler",
  "bronze-osandy-gate-valve",
  "mechanic-es480-48-in-1-precision-electric-screwdriver-set",
  "manual-lever-control-foam-monitor-double-waterway",
  "conventional-heat-detector-en-54",
];
export const PROTECT_SLUGS = ["pressure-relief-valve", "storz-collecting-breeching", "lever-operated-hand-held-branchpipe"];

const one = (slug: string) => safe(api.product(slug).then((r) => r.product), null as Product | null).catch(() => null);
const many = async (slugs: readonly string[]) => (await Promise.all(slugs.map(one))).filter(Boolean) as Product[];

export async function loadHome() {
  const [parts, detail, selected, protect, { categories }, latest] = await Promise.all([
    many(HERO_PARTS.map((p) => p.slug)), one(DETAIL_SLUG), many(SELECTED_SLUGS), many(PROTECT_SLUGS),
    safe(api.categories(), { categories: [] }),
    safe(api.products({ limit: 1 }), { products: [], pagination: { page: 1, limit: 1, total: 0, pages: 1 } }),
  ]);
  const hero = HERO_PARTS.map((spec) => {
    const p = parts.find((x) => x.slug === spec.slug);
    return p?.images[0] ? { ...spec, name: p.name, image: trimmed(p.images[0].url) } : null;
  }).filter(Boolean) as (typeof HERO_PARTS[number] & { name: string; image: string })[];
  return {
    hero, detail, detailImage: detail?.images[0] ? cld(detail.images[0].url, DETAIL_CROP) : "",
    selected, protect, categories, total: latest.pagination.total,
  };
}
