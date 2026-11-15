import Product, { publicationBlockers } from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import ImportJob from "../models/ImportJob.js";
import MediaAsset from "../models/MediaAsset.js";
import * as primegadgets from "./importers/primegadgets.js";
import { toSlug } from "../utils/validate.js";

export const SOURCES = { [primegadgets.SOURCE]: primegadgets };

function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

// Copy company-owned source images into our media library when Cloudinary is configured;
// otherwise keep the source URL so the record stays usable.
async function importImages(images, actor) {
  if (!cloudinaryConfigured()) return images;
  const { default: cloudinary } = await import("../config/cloudinary.js");
  const out = [];
  for (const image of images) {
    try {
      const result = await cloudinary.uploader.upload(image.url, {
        folder: `${process.env.CLOUDINARY_FOLDER || "OsakaTool"}/products`,
        transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }],
      });
      await MediaAsset.create({ url: result.secure_url, publicId: result.public_id, kind: "image", format: result.format,
        bytes: result.bytes, uploadedBy: actor, sourceUrl: image.url });
      out.push({ url: result.secure_url, publicId: result.public_id, alt: image.alt });
    } catch (err) {
      console.warn("[import] image copy failed, keeping source URL:", err.message);
      out.push(image);
    }
  }
  return out;
}

async function brandFor(name) {
  if (!name) return null;
  const slug = toSlug(name);
  return Brand.findOneAndUpdate({ slug }, { $setOnInsert: { name, slug, kind: "manufacturer" } }, { upsert: true, new: true });
}

/**
 * Runs an import. mode "preview" writes nothing except the job record.
 * autoPublish publishes complete, non-medical records whose manufacturer is stated at source;
 * everything else lands in "review" for a human decision.
 */
export async function runImport({ source = primegadgets.SOURCE, mode = "preview", autoPublish = true, actor = "system", fetcher } = {}) {
  const adapter = SOURCES[source];
  if (!adapter) throw Object.assign(new Error(`Unknown import source "${source}"`), { status: 400 });

  const job = await ImportJob.create({ source, mode, startedBy: actor });
  const record = (item) => job.items.push(item);
  try {
    const raw = await adapter.fetchAll(fetcher);
    job.stats.fetched = raw.length;
    const categories = new Map((await Category.find().select("_id slug").lean()).map((c) => [c.slug, c._id]));
    const seenModels = new Set();

    for (const item of raw) {
      let n;
      try {
        n = adapter.normalize(item);
        if (!n.relevant) { job.stats.skipped++; record({ sourceId: n.sourceId, name: n.name, action: "skip", reason: n.reason }); continue; }
        job.stats.relevant++;
        const categoryId = categories.get(n.categorySlug);
        if (!categoryId) throw new Error(`Category "${n.categorySlug}" is missing; run the taxonomy seed first`);

        // Deduplicate within the batch and against other sources by model number / SKU.
        const modelKey = n.modelNumber && `${n.manufacturer}|${n.modelNumber}`.toLowerCase();
        if (modelKey && seenModels.has(modelKey)) { job.stats.skipped++; record({ sourceId: n.sourceId, name: n.name, action: "duplicate", reason: `Duplicate model ${n.modelNumber} in this batch` }); continue; }
        if (modelKey) seenModels.add(modelKey);

        const existing = await Product.findOne({ "source.system": source, "source.sourceId": n.sourceId });
        if (!existing) {
          const clash = await Product.findOne({ $or: [
            ...(n.modelNumber ? [{ modelNumber: n.modelNumber, manufacturer: n.manufacturer }] : []),
            ...(n.sku ? [{ sku: n.sku }] : []),
          ] }).select("name source.system").lean();
          if (clash && (n.modelNumber || n.sku)) {
            job.stats.skipped++;
            record({ sourceId: n.sourceId, name: n.name, action: "duplicate", category: n.categorySlug, reason: `Matches existing product "${clash.name}"` });
            continue;
          }
        }

        if (existing && existing.source.contentHash === n.contentHash) {
          job.stats.unchanged++; record({ sourceId: n.sourceId, name: n.name, action: "unchanged", category: n.categorySlug }); continue;
        }

        const action = existing ? "update" : "create";
        if (mode === "commit") {
          if (existing) {
            if (["draft", "review"].includes(existing.status)) {
              Object.assign(existing, { shortDescription: n.shortDescription, description: n.description, features: n.features,
                inBox: n.inBox, warranty: n.warranty });
            } else {
              existing.reviewNotes = [...new Set([...existing.reviewNotes, `Source content changed on ${new Date().toISOString().slice(0, 10)}; review the listing.`])];
            }
            existing.source.contentHash = n.contentHash;
            existing.source.importedAt = new Date();
            existing.source.importJob = job._id;
            await existing.save();
          } else {
            const brand = await brandFor(n.manufacturer);
            const prefixed = n.modelNumber && !n.name.toLowerCase().startsWith(n.manufacturer.toLowerCase());
            let slug = toSlug(prefixed ? `${n.manufacturer} ${n.name}` : n.name);
            if (await Product.exists({ slug })) slug = `${slug}-${n.sourceId.slice(-6)}`;
            const product = new Product({
              name: n.name, slug, shortDescription: n.shortDescription, description: n.description, category: categoryId,
              brand: brand?._id || null, manufacturer: n.manufacturer, modelNumber: n.modelNumber, sku: n.sku,
              features: n.features, inBox: n.inBox, specifications: n.specifications, warranty: n.warranty,
              images: await importImages(n.images, actor), reviewNotes: n.reviewNotes,
              regulatory: { isMedical: n.isMedical, markets: [] }, regions: [],
              source: { system: source, sourceId: n.sourceId, url: n.sourceUrl, importedAt: new Date(), importJob: job._id, contentHash: n.contentHash },
              status: "review",
            });
            const publishable = autoPublish && !n.isMedical && n.sourceBrand && !publicationBlockers(product).length;
            if (publishable) product.status = "published";
            await product.save();
            record({ sourceId: n.sourceId, name: n.name, action: publishable ? "create+publish" : "create (review)", category: n.categorySlug });
            job.stats.created++;
            continue;
          }
        }
        job.stats[action === "create" ? "created" : "updated"]++;
        record({ sourceId: n.sourceId, name: n.name, action: mode === "preview" ? `would ${action}` : action, category: n.categorySlug });
      } catch (err) {
        job.stats.errors++;
        job.errorLog.push({ sourceId: String(item?._id || ""), message: err.message });
      }
    }
    job.status = "completed";
  } catch (err) {
    job.status = "failed";
    job.errorLog.push({ sourceId: "", message: err.message });
  }
  job.finishedAt = new Date();
  await job.save();
  return job.toObject();
}
