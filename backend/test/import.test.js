import test from "node:test";
import assert from "node:assert/strict";
import { classify, extractModel, extractSpecs, normalize } from "../src/services/importers/primegadgets.js";
import { CATEGORIES } from "../src/seed/taxonomy.js";

const raw = (name, extra = {}) => ({ _id: `id-${name.length}`, name, brand: "NOVA TECH", sku: "PG-1", isActive: true,
  images: [{ url: "https://api.primegadgets.ae/media/a.webp" }], features: [], specifications: [], ...extra });

test("relevance filter keeps instruments and tools, rejects consumer goods", () => {
  assert.equal(classify("REF 3670 Portable Air Compressor 80W, Rechargeable Digital Tire Inflator 150 PSI")?.category, "air-compressors-inflators");
  assert.equal(classify("MECHANIC ES480 48-in-1 Precision Electric Screwdriver Set")?.category, "soldering-repair");
  assert.equal(classify("7.5M / 25FT Measuring Tape, Heavy Duty")?.category, "dimensional-measurement");
  assert.equal(classify("UNI-T UT61E True RMS Digital Multimeter")?.category, "digital-multimeters");
  assert.equal(classify("Fingertip Pulse Oximeter SpO2 Monitor")?.medical, true);
  assert.equal(classify("Digital Soldering Iron Station 60W")?.category, "soldering-repair");
  for (const name of ["Portable Barrel BBQ Grill & Smoker with Built-in Thermometer", "Professional Hair Dryer 2000W",
    "Electric Popcorn Maker Machine 900W", "iPhone 17 Pro Max Case with 360° Rotating Ring Stand"]) {
    assert.equal(classify(name), null, name);
  }
});

test("every classifier target exists in the taxonomy", async () => {
  const { RULES } = await import("../src/services/importers/primegadgets.js");
  const slugs = new Set(CATEGORIES.map((c) => c.slug));
  for (const rule of RULES) assert.ok(slugs.has(rule.category), rule.category);
});

test("model numbers and specifications are extracted, never invented", () => {
  assert.equal(extractModel("CZK-3668 Portable Electric Car Air Pump"), "CZK-3668");
  assert.equal(extractModel("MECHANIC ES480 48-in-1 Precision"), "ES480");
  assert.equal(extractModel("7.5M / 25FT Measuring Tape"), "");
  const specs = extractSpecs("Rechargeable Digital Tire Inflator 150 PSI with LED Display, Auto Shut-Off, 80W");
  assert.deepEqual(specs.find((s) => s.label === "Maximum pressure"), { group: "Performance", label: "Maximum pressure", value: "150", unit: "PSI", filterable: true });
  assert.ok(specs.find((s) => s.label === "Auto shut-off"));
  assert.equal(extractSpecs("Plain product name").length, 0);
});

test("normalisation preserves the real manufacturer and source provenance", () => {
  const n = normalize(raw("MECHANIC ES480 48-in-1 Precision Electric Screwdriver Set, Rechargeable"));
  assert.equal(n.relevant, true);
  assert.equal(n.manufacturer, "MECHANIC");
  assert.equal(n.sourceBrand, "NOVA TECH");
  assert.match(n.sourceUrl, /^https:\/\/primegadgets\.ae/);
  assert.ok(n.contentHash.length === 64);
  assert.ok(!/osaka/i.test(n.manufacturer), "never rebrands to OSAKA TOOL");

  const fallback = normalize(raw("CZK-3668 Portable Electric Car Air Pump, Rechargeable"));
  assert.equal(fallback.manufacturer, "NOVA TECH");
  assert.match(fallback.reviewNotes[0], /confirm the actual maker/);

  const medical = normalize(raw("Upper Arm Blood Pressure Monitor, Large Cuff"));
  assert.equal(medical.isMedical, true);
  assert.ok(medical.reviewNotes.some((n) => /Medical device/.test(n)));

  assert.equal(normalize(raw("Electric Steam Iron, Non-Stick")).relevant, false);
  assert.equal(normalize(raw("Digital Multimeter", { isActive: false })).relevant, false);
});

test("content hash changes only when source content changes", () => {
  const a = normalize(raw("REF 3670 Portable Air Compressor 80W"));
  const b = normalize(raw("REF 3670 Portable Air Compressor 80W"));
  const c = normalize(raw("REF 3670 Portable Air Compressor 80W", { warranty: "2 Years" }));
  assert.equal(a.contentHash, b.contentHash);
  assert.notEqual(a.contentHash, c.contentHash);
});
