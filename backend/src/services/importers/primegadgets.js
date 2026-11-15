// Prime Gadgets UAE (company-owned store) product source.
// Public API discovered from the storefront bundle: GET {base}/api/v1/products?limit=N
import { createHash } from "node:crypto";

export const SOURCE = "primegadgets";
const BASE = process.env.PRIMEGADGETS_API || "https://api.primegadgets.ae";
const STORE = "https://primegadgets.ae";

// First matching rule wins. Exclusions run before inclusions so that, e.g., a
// BBQ grill with a built-in thermometer is never classified as a thermometer.
const EXCLUDE = /\b(bbq|barbecue|grill|smoker|popcorn|kitchen|food|meat|coffee|spice|hair|massag|makeup|toy|kids|swim|wallet|case|bottle|flask|iron|lamp|projector|fan|oud|bakhoor|trimmer|dish|garlic|potato|noodle|idiyappam|art set)\b/i;
export const RULES = [
  { category: "blood-pressure-monitors", re: /blood\s*pressure|sphygmomanometer/i, medical: true },
  { category: "blood-glucose-monitors", re: /glucose|glucometer/i, medical: true },
  { category: "pulse-oximeters", re: /oximeter|spo2/i, medical: true },
  { category: "digital-thermometers", re: /\b(clinical|infrared|forehead|ear|body)\b.*thermometer|thermometer.*\b(clinical|infrared|forehead|ear|body)\b/i, medical: true },
  { category: "digital-multimeters", re: /multimeter/i },
  { category: "clamp-meters", re: /clamp\s*meter/i },
  { category: "insulation-voltage-testers", re: /insulation|megger|voltage\s*(tester|detector)|test\s*pen/i },
  { category: "oscilloscopes", re: /oscilloscope/i },
  { category: "soldering-repair", re: /solder|screwdriver|rework|desolder/i },
  { category: "pressure-measurement", re: /pressure\s*gauge|manometer/i },
  { category: "air-compressors-inflators", re: /tire\s*inflator|tyre\s*inflator|air\s*(compressor|pump)/i },
  { category: "dimensional-measurement", re: /tape\s*measure|measuring\s*tape|caliper|micrometer|laser\s*(distance|measure)/i },
  { category: "environmental-monitoring", re: /hygrometer|anemometer|lux\s*meter|sound\s*level|air\s*quality|co2\s*(meter|monitor)/i },
];

// Brand prefixes in titles that identify the real maker more precisely than the store's brand field.
const KNOWN_MAKERS = ["MECHANIC", "UNI-T", "FLUKE", "HIOKI", "KYORITSU", "OWON", "OMRON", "BEURER", "ROSSMAX", "MICROLIFE", "ACCU-CHEK"];

export function classify(name) {
  const instrument = /thermometer|multimeter|oscilloscope|solder|clamp\s*meter|oximeter|blood\s*pressure|glucose/i;
  if (EXCLUDE.test(name) && !instrument.test(name.replace(/built-in thermometer/i, ""))) {
    return null;
  }
  return RULES.find((r) => r.re.test(name)) || null;
}

export function extractModel(name) {
  const m = name.match(/\b([A-Z]{1,6}[- ]?\d{2,}[A-Z0-9]*)\b/);
  return m ? m[1].trim() : "";
}

export function extractSpecs(text) {
  const specs = [];
  const add = (group, label, value, unit = "", filterable = false) => specs.push({ group, label, value, unit, filterable });
  let m;
  if ((m = text.match(/(\d{2,4})\s?PSI/i))) add("Performance", "Maximum pressure", m[1], "PSI", true);
  if ((m = text.match(/(\d{1,4})\s?W\b/))) add("Electrical", "Rated power", m[1], "W", true);
  if ((m = text.match(/(\d{3,5})\s?mAh/i))) add("Electrical", "Battery capacity", m[1], "mAh", true);
  if ((m = text.match(/(\d+(?:\.\d+)?)\s?M\s*\/\s*(\d+)\s?FT/i))) add("Dimensions", "Blade length", `${m[1]} m / ${m[2]} ft`, "", true);
  if ((m = text.match(/(\d{1,3})-in-1/i))) add("Configuration", "Bits / functions", m[1], "", true);
  if (/rechargeable/i.test(text)) add("Electrical", "Power source", "Rechargeable battery", "", true);
  if (/USB[- ]?C|Type[- ]?C/i.test(text)) add("Electrical", "Charging port", "USB Type-C");
  if (/LED display|digital display|LCD/i.test(text)) add("Interface", "Display", /LCD/i.test(text) ? "LCD" : "LED digital display");
  if (/auto shut[- ]?off/i.test(text)) add("Safety", "Auto shut-off", "Yes");
  return specs;
}

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function normalize(raw) {
  const title = String(raw.name || "").replace(/\s+/g, " ").trim();
  const rule = classify(title);
  if (!rule) return { relevant: false, sourceId: raw._id, name: title, reason: "Outside the OSAKA TOOL product taxonomy" };
  if (raw.isActive === false) return { relevant: false, sourceId: raw._id, name: title, reason: "Inactive at source" };

  const segments = title.split(/,\s+/).map((s) => s.trim()).filter(Boolean);
  const upper = title.toUpperCase();
  const maker = KNOWN_MAKERS.find((k) => upper.startsWith(`${k} `) || upper.includes(` ${k} `));
  const product = {
    name: segments[0].slice(0, 240),
    shortDescription: (raw.shortDescription && raw.shortDescription !== title ? raw.shortDescription : segments.slice(0, 2).join(", ")).slice(0, 500),
    description: String(raw.description || title).slice(0, 20000),
    categorySlug: rule.category,
    isMedical: Boolean(rule.medical),
    sourceBrand: String(raw.brand || "").trim(),
    manufacturer: maker || String(raw.brand || "").trim(),
    modelNumber: extractModel(title),
    sku: String(raw.sku || "").trim(),
    features: [...(raw.features || []), ...segments.slice(1)].map(String).slice(0, 20),
    inBox: (raw.inBox || []).map(String).slice(0, 20),
    specifications: [
      ...(raw.specifications || []).filter((s) => s?.label && s?.value)
        .map((s) => ({ group: "General", label: String(s.label), value: String(s.value), unit: "", filterable: false })),
      ...extractSpecs(title),
    ],
    warranty: String(raw.warranty || ""),
    images: (raw.images || []).filter((i) => i?.url).map((i) => ({ url: i.url, alt: segments[0].slice(0, 200) })),
    sourceId: String(raw._id),
    sourceUrl: raw.slug ? `${STORE}/products/${raw.slug}` : STORE,
  };
  product.reviewNotes = [
    maker ? `Manufacturer "${maker}" detected in the source title.` : `Manufacturer taken from the Prime Gadgets brand field ("${product.sourceBrand || "empty"}"); confirm the actual maker.`,
    "Country of origin is not stated at source; add it from supplier documents.",
  ];
  if (product.isMedical) product.reviewNotes.push("Medical device: add market registrations and evidence before publication.");
  product.contentHash = hash({ n: title, d: raw.description, f: raw.features, s: raw.specifications, i: product.images.map((i) => i.url), w: raw.warranty });
  return { relevant: true, ...product };
}

export async function fetchAll(fetcher = fetch) {
  const res = await fetcher(`${BASE}/api/v1/products?limit=500`, {
    headers: { Accept: "application/json", "User-Agent": "OsakaToolCatalogImporter/1.0" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Prime Gadgets API responded ${res.status}`);
  const body = await res.json();
  if (!body?.success || !Array.isArray(body.products)) throw new Error("Unexpected Prime Gadgets API response shape");
  return body.products;
}
