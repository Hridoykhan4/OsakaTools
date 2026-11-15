// One-off, idempotent copy of the company's legacy fire-protection and building-services
// catalogue into the OSAKA TOOL database. The legacy database is opened READ-ONLY (find
// queries only) and is never modified. Images are copied into the OsakaTool Cloudinary folder
// so the new catalogue does not depend on the legacy media.
//
//   node src/scripts/import-legacy.js            # dry run
//   node src/scripts/import-legacy.js commit     # write
import "dotenv/config";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import MediaAsset from "../models/MediaAsset.js";
import { toSlug } from "../utils/validate.js";

const COMMIT = process.argv[2] === "commit";
const LEGACY_DB = process.env.LEGACY_DB || "osaka_toyo";
const SYSTEM = "legacy-catalogue";
const FOLDER = process.env.CLOUDINARY_FOLDER || "OsakaTool";
const PARENT = {
  slug: "fire-protection-building-services", name: "Fire Protection & Building Services", icon: "flame", order: 7,
  tagline: "Valves, sprinklers, pumps, alarm and life-safety systems for projects worldwide",
  description: "Fire protection valves, sprinklers, pumps, hydrants and cabinets, foam systems, fire alarm devices, emergency lighting, pipe, fittings and conduit for contractors and building owners.",
  guide: "## Specifying fire protection equipment\n\nFire protection components are selected against the standard the project is designed to: NFPA (Americas and much of the Middle East), EN and BS (Europe, UK and Commonwealth markets) or local codes. State the design standard, working pressure, end connections (grooved, flanged or threaded) and pipe size with every enquiry.\n\n## Approvals\n\nWhere a listing or approval (for example UL or FM) is required by the authority having jurisdiction, ask for the certificate with the quotation. Certificates are supplied per model and per size.",
};

let cloudinary = null;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary = (await import("../config/cloudinary.js")).default;
}

async function copyImage(image, sub) {
  if (!image?.url || !cloudinary || !COMMIT) return image ? { url: image.url, publicId: "", alt: image.alt || "" } : null;
  const existing = await MediaAsset.findOne({ sourceUrl: image.url }).lean();
  if (existing) return { url: existing.url, publicId: existing.publicId, alt: image.alt || "" };
  try {
    const r = await cloudinary.uploader.upload(image.url, { folder: `${FOLDER}/${sub}`, transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }] });
    await MediaAsset.create({ url: r.secure_url, publicId: r.public_id, kind: "image", format: r.format, bytes: r.bytes, sourceUrl: image.url });
    return { url: r.secure_url, publicId: r.public_id, alt: image.alt || "" };
  } catch (err) {
    console.warn("[legacy] image copy failed, keeping source URL:", err.message);
    return { url: image.url, publicId: "", alt: image.alt || "" };
  }
}

await connectDB();
const client = await MongoClient.connect(process.env.MONGODB_URI);
const legacy = client.db(LEGACY_DB);
const [legacyCats, legacyProducts] = await Promise.all([
  legacy.collection("categories").find({}).toArray(),
  legacy.collection("products").find({ published: { $ne: false } }).toArray(),
]);
console.log(`[legacy] source: ${legacyCats.length} categories, ${legacyProducts.length} products (${COMMIT ? "commit" : "dry run"})`);

const stats = { categoriesCreated: 0, created: 0, unchanged: 0 };
let parent = await Category.findOne({ slug: PARENT.slug });
if (!parent && COMMIT) { parent = await Category.create(PARENT); stats.categoriesCreated++; }

const catMap = new Map();
for (const [i, c] of legacyCats.entries()) {
  let cat = await Category.findOne({ slug: c.slug });
  if (!cat && COMMIT) {
    cat = await Category.create({
      name: c.name, slug: c.slug, description: c.description || "", tagline: c.description || "", icon: "flame",
      parent: parent?._id || null, order: c.order ?? i + 1, image: (await copyImage(c.image, "categories")) || undefined,
    });
    stats.categoriesCreated++;
  }
  if (cat) catMap.set(String(c._id), cat._id);
}

for (const p of legacyProducts) {
  const sourceId = String(p._id);
  if (await Product.exists({ "source.system": SYSTEM, "source.sourceId": sourceId })) { stats.unchanged++; continue; }
  if (!COMMIT) { stats.created++; continue; }
  const images = [];
  for (const img of p.images || []) { const out = await copyImage(img, "products"); if (out) images.push(out); }
  let slug = p.slug || toSlug(p.name);
  if (await Product.exists({ slug })) slug = `${slug}-${sourceId.slice(-5)}`;
  await Product.create({
    name: p.name, slug, shortDescription: p.shortDescription || "", description: p.description || p.shortDescription || "",
    category: catMap.get(String(p.category)), manufacturer: "Partner manufacturer", sku: p.sku || "",
    images, specifications: p.specifications || [], certifications: p.certifications || [],
    featured: Boolean(p.featured), status: images.length ? "published" : "draft",
    source: { system: SYSTEM, sourceId, url: "", importedAt: new Date(), contentHash: "" },
    reviewNotes: [
      "Imported from the company's legacy fire-protection catalogue.",
      ...(p.certifications?.length ? ["Listed approvals were carried over from the legacy catalogue: attach the certificates in Documents."] : []),
    ],
  });
  stats.created++;
}

console.log("[legacy] result", stats);
await client.close();
await mongoose.disconnect();
