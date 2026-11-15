import Product, { PRODUCT_STATUSES, publicationBlockers } from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { commitContent } from "../services/indexnow.js";
import { enabled as indexingEnabled } from "../services/indexnow-policy.js";
import { audit, diff } from "../services/audit.js";
import { can } from "../middleware/auth.js";
import { escapeRegex, httpError, isId, pageParams, pagination, safeUrl, str, strList, toSlug } from "../utils/validate.js";

const SORTS = {
  newest: { publishedAt: -1, createdAt: -1 },
  name: { name: 1 },
  "-name": { name: -1 },
  updated: { updatedAt: -1 },
  featured: { featured: -1, publishedAt: -1 },
};
const CARD_FIELDS = "name slug shortDescription images manufacturer modelNumber sku category brand status featured specifications regulatory.isMedical updatedAt publishedAt";

// Category slug -> ids of that category and all of its descendants.
export async function categoryTreeIds(slug) {
  const all = await Category.find().select("_id slug parent").lean();
  const root = all.find((c) => c.slug === slug);
  if (!root) return null;
  const ids = [root._id];
  for (let i = 0; i < ids.length; i++) {
    for (const c of all) if (String(c.parent) === String(ids[i])) ids.push(c._id);
  }
  return ids;
}

async function buildFilter(query, isAdmin) {
  const filter = {};
  if (isAdmin && query.status && PRODUCT_STATUSES.includes(query.status)) filter.status = query.status;
  else if (!isAdmin || query.public === "true") filter.status = "published";

  if (query.category) {
    const ids = await categoryTreeIds(String(query.category));
    filter.category = ids ? { $in: ids } : null;
  }
  if (query.brand) {
    const brand = await Brand.findOne({ slug: String(query.brand) }).select("_id").lean();
    filter.brand = brand ? brand._id : null;
  }
  if (query.manufacturer) filter.manufacturer = String(query.manufacturer).slice(0, 120);
  if (query.featured === "true") filter.featured = true;
  if (query.medical === "true") filter["regulatory.isMedical"] = true;
  if (isAdmin && query.source) filter["source.system"] = String(query.source);

  // spec=Label::Value (repeatable) — products must match every selected spec.
  const specs = [].concat(query.spec || []).slice(0, 8).map(String).filter((s) => s.includes("::"));
  if (specs.length) {
    filter.$and = specs.map((s) => {
      const [label, value] = s.split("::");
      return { specifications: { $elemMatch: { label, value } } };
    });
  }

  const q = str(query.q, 120);
  if (q) {
    // Model numbers and SKUs are matched as prefixes; text search covers names and descriptions.
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { modelNumber: rx }, { sku: rx }, { manufacturer: rx }];
  }
  return filter;
}

async function facets(baseFilter) {
  const [manufacturers, brands, specs] = await Promise.all([
    Product.aggregate([{ $match: baseFilter }, { $match: { manufacturer: { $gt: "" } } },
      { $group: { _id: "$manufacturer", count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 50 }]),
    Product.aggregate([{ $match: baseFilter }, { $match: { brand: { $ne: null } } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $lookup: { from: "brands", localField: "_id", foreignField: "_id", as: "b" } }, { $unwind: "$b" },
      { $project: { _id: 0, name: "$b.name", slug: "$b.slug", count: 1 } }, { $sort: { name: 1 } }]),
    Product.aggregate([{ $match: baseFilter }, { $unwind: "$specifications" }, { $match: { "specifications.filterable": true } },
      { $group: { _id: { label: "$specifications.label", value: "$specifications.value" }, count: { $sum: 1 } } },
      { $group: { _id: "$_id.label", values: { $push: { value: "$_id.value", count: "$count" } } } },
      { $sort: { _id: 1 } }, { $limit: 12 }]),
  ]);
  return {
    manufacturers: manufacturers.map((m) => ({ name: m._id, count: m.count })),
    brands,
    specs: specs.map((s) => ({ label: s._id, values: s.values.sort((a, b) => a.value.localeCompare(b.value)) })),
  };
}

export const listProducts = asyncHandler(async (req, res) => {
  const isAdmin = Boolean(req.admin);
  const filter = await buildFilter(req.query, isAdmin);
  const { page, limit, skip } = pageParams(req.query, 24, 100);
  const sort = SORTS[req.query.sort] || (isAdmin ? SORTS.updated : SORTS.featured);

  const [products, total, facetData] = await Promise.all([
    Product.find(filter).select(isAdmin ? `${CARD_FIELDS} source.system createdAt` : CARD_FIELDS)
      .populate("category", "name slug").populate("brand", "name slug kind")
      .sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
    req.query.facets === "true"
      ? facets({ status: filter.status || { $exists: true }, ...(filter.category !== undefined ? { category: filter.category } : {}) })
      : null,
  ]);
  res.json({ products, pagination: pagination(page, limit, total), ...(facetData ? { facets: facetData } : {}) });
});

export const getProduct = asyncHandler(async (req, res) => {
  const filter = { slug: String(req.params.slug) };
  if (!req.admin) filter.status = "published";
  const product = await Product.findOne(filter).populate("category", "name slug parent").populate("brand", "name slug kind country website").lean();
  if (!product) return res.status(404).json({ message: "Product not found" });

  if (!req.admin) {
    product.documents = (product.documents || []).filter((d) => d.public);
    delete product.source;
    delete product.reviewNotes;
  }
  const related = await Product.find({ category: product.category?._id, _id: { $ne: product._id }, status: "published" })
    .select(CARD_FIELDS).populate("category", "name slug").sort({ featured: -1, publishedAt: -1 }).limit(4).lean();
  res.json({ product, related });
});

export const getProductById = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const product = await Product.findById(req.params.id).populate("category", "name slug").populate("brand", "name slug").lean();
  if (!product) throw httpError(404, "Product not found");
  res.json({ product, blockers: publicationBlockers(product) });
});

export const compareProducts = asyncHandler(async (req, res) => {
  const slugs = String(req.query.slugs || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const products = await Product.find({ slug: { $in: slugs }, status: "published" })
    .select(`${CARD_FIELDS} warranty countryOfOrigin moq leadTime`).populate("category", "name slug").populate("brand", "name slug").lean();
  products.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
  res.json({ products });
});

// ---- writes ----
const EDITABLE = ["name", "shortDescription", "description", "category", "brand", "manufacturer", "modelNumber", "sku", "gtin",
  "countryOfOrigin", "originVerified", "privateLabel", "images", "specifications", "features", "applications", "inBox", "documents",
  "certifications", "warranty", "moq", "leadTime", "regions", "regulatory", "seo", "featured", "reviewNotes"];

function sanitize(body) {
  const out = {};
  const has = (k) => body[k] !== undefined;
  if (has("name")) out.name = str(body.name, 240);
  if (has("shortDescription")) out.shortDescription = str(body.shortDescription, 500);
  if (has("description")) out.description = str(body.description, 20000);
  for (const k of ["manufacturer", "modelNumber", "sku", "countryOfOrigin", "warranty", "leadTime"]) if (has(k)) out[k] = str(body[k], 120);
  if (has("gtin")) out.gtin = str(body.gtin, 20).replace(/\D/g, "");
  if (has("category")) out.category = isId(body.category) ? body.category : undefined;
  if (has("brand")) out.brand = isId(body.brand) ? body.brand : null;
  if (has("originVerified")) out.originVerified = Boolean(body.originVerified);
  if (has("featured")) out.featured = Boolean(body.featured);
  if (has("moq")) out.moq = Math.max(1, parseInt(body.moq, 10) || 1);
  for (const k of ["features", "applications", "inBox", "certifications", "regions", "reviewNotes"]) if (has(k)) out[k] = strList(body[k], 60, 300);
  if (has("images")) {
    out.images = (Array.isArray(body.images) ? body.images : []).slice(0, 20)
      .map((i) => ({ url: safeUrl(i?.url), publicId: str(i?.publicId, 200), alt: str(i?.alt, 200) })).filter((i) => i.url);
  }
  if (has("specifications")) {
    out.specifications = (Array.isArray(body.specifications) ? body.specifications : []).slice(0, 150)
      .map((s) => ({ group: str(s?.group, 80) || "General", label: str(s?.label, 120), value: str(s?.value, 300),
        unit: str(s?.unit, 30), filterable: Boolean(s?.filterable) }))
      .filter((s) => s.label && s.value);
  }
  if (has("documents")) {
    out.documents = (Array.isArray(body.documents) ? body.documents : []).slice(0, 30)
      .map((d) => ({ title: str(d?.title, 160), kind: d?.kind, url: safeUrl(d?.url), publicId: str(d?.publicId, 200), public: d?.public !== false }))
      .filter((d) => d.title && d.url);
  }
  if (has("privateLabel")) {
    out.privateLabel = {
      status: ["none", "pending", "approved"].includes(body.privateLabel?.status) ? body.privateLabel.status : "none",
      evidence: isId(body.privateLabel?.evidence) ? body.privateLabel.evidence : null,
    };
  }
  if (has("regulatory")) {
    const r = body.regulatory || {};
    out.regulatory = {
      isMedical: Boolean(r.isMedical), deviceClass: str(r.deviceClass, 40), intendedUse: str(r.intendedUse, 1000),
      markets: (Array.isArray(r.markets) ? r.markets : []).slice(0, 30).map((m) => ({
        region: str(m?.region, 60), authority: str(m?.authority, 80), registrationNo: str(m?.registrationNo, 120),
        status: ["not-applicable", "pending", "registered", "not-eligible"].includes(m?.status) ? m.status : "pending",
        evidence: isId(m?.evidence) ? m.evidence : null,
      })).filter((m) => m.region),
    };
  }
  if (has("seo")) {
    out.seo = { title: str(body.seo?.title, 120), description: str(body.seo?.description, 320),
      canonical: safeUrl(body.seo?.canonical), noindex: Boolean(body.seo?.noindex) };
  }
  return out;
}

// Approved private label requires an evidence document that has been verified.
async function assertPrivateLabel(product) {
  if (product.privateLabel?.status !== "approved") return;
  const { default: Document } = await import("../models/Document.js");
  const doc = product.privateLabel.evidence && await Document.findById(product.privateLabel.evidence).select("status").lean();
  if (!doc || doc.status !== "verified") throw httpError(400, "Private-label approval needs a verified evidence document");
}

async function applyStatus(req, product, status) {
  if (status === undefined || status === product.status) return;
  if (!PRODUCT_STATUSES.includes(status)) throw httpError(400, "Invalid status");
  if (status === "published") {
    if (!can(req.admin.role, "catalog:publish")) throw httpError(403, "Only admins can publish products");
    const blockers = publicationBlockers(product);
    if (blockers.length) throw httpError(422, `Cannot publish: ${blockers.join("; ")}`);
  }
  product.status = status;
}

async function productPaths(product, previousCategory, wasPublished) {
  if (!indexingEnabled() || !(product.published || wasPublished)) return [];
  const paths = ["/", "/products", "/categories", `/products/${product.slug}`];
  for (const id of new Set([String(product.category), String(previousCategory || product.category)])) {
    const category = await Category.findById(id).select("slug").lean();
    if (category) paths.push(`/categories/${category.slug}`);
  }
  return paths;
}

export const createProduct = asyncHandler(async (req, res) => {
  const data = sanitize(req.body);
  if (!data.name || !data.category) throw httpError(400, "Name and a valid category are required");
  if (!(await Category.exists({ _id: data.category }))) throw httpError(400, "Category does not exist");

  let slug = toSlug(req.body.slug || data.name) || `product-${Date.now().toString(36)}`;
  if (await Product.exists({ slug })) slug = `${slug}-${Date.now().toString(36)}`;
  const product = new Product({ ...data, slug, status: "draft" });
  await applyStatus(req, product, req.body.status);
  await assertPrivateLabel(product);
  await commitContent(await productPaths(product), (session) => product.save({ session }));
  await audit(req, "create", "product", product._id, `Created ${product.name} (${product.status})`);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, "Product not found");

  const before = product.toObject();
  const data = sanitize(req.body);
  if (data.category === undefined) delete data.category;
  else if (!(await Category.exists({ _id: data.category }))) throw httpError(400, "Category does not exist");
  // Renaming keeps the established public URL.
  Object.assign(product, data);
  await applyStatus(req, product, req.body.status);
  if (product.status === "published" && publicationBlockers(product).length) {
    throw httpError(422, `Published products must stay complete: ${publicationBlockers(product).join("; ")}`);
  }
  await assertPrivateLabel(product);
  await commitContent(await productPaths(product, before.category, before.published), (session) => product.save({ session }));
  await audit(req, "update", "product", product._id, `Updated ${product.name}`,
    diff(before, product.toObject(), [...EDITABLE, "status"]));
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, "Product not found");
  await commitContent(await productPaths(product, product.category, product.published), (session) => product.deleteOne({ session }));
  await audit(req, "delete", "product", product._id, `Deleted ${product.name}`);
  res.json({ message: "Product deleted" });
});

export const bulkProducts = asyncHandler(async (req, res) => {
  const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).filter(isId).slice(0, 500);
  const action = String(req.body.action || "");
  if (!ids.length) throw httpError(400, "Select at least one product");
  const role = req.admin.role;
  const results = { updated: 0, failed: [] };

  if (action === "delete") {
    if (!can(role, "catalog:delete")) throw httpError(403, "Only admins can delete products");
    const r = await Product.deleteMany({ _id: { $in: ids } });
    results.updated = r.deletedCount;
  } else if (["publish", "review", "draft", "archive", "feature", "unfeature", "category"].includes(action)) {
    if (action === "publish" && !can(role, "catalog:publish")) throw httpError(403, "Only admins can publish products");
    let category = null;
    if (action === "category") {
      if (!isId(req.body.category) || !(await Category.exists({ _id: req.body.category }))) throw httpError(400, "Choose a valid category");
      category = req.body.category;
    }
    for (const product of await Product.find({ _id: { $in: ids } })) {
      try {
        if (action === "feature" || action === "unfeature") product.featured = action === "feature";
        else if (action === "category") product.category = category;
        else await applyStatus(req, product, { publish: "published", archive: "archived" }[action] || action);
        await product.save();
        results.updated++;
      } catch (err) {
        results.failed.push({ id: product._id, name: product.name, message: err.message });
      }
    }
  } else {
    throw httpError(400, "Unknown bulk action");
  }
  await audit(req, `bulk.${action}`, "product", "", `${action} on ${ids.length} products: ${results.updated} succeeded, ${results.failed.length} failed`);
  res.json(results);
});

export const productHistory = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({ entity: "product", entityId: String(req.params.id) }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ logs });
});
