// Brands and evidence documents.
import Brand from "../models/Brand.js";
import Document, { DOCUMENT_TYPES } from "../models/Document.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../services/audit.js";
import { can } from "../middleware/auth.js";
import { httpError, isId, safeUrl, str, toSlug } from "../utils/validate.js";

// ---- brands ----
export const listBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ kind: 1, name: 1 }).lean();
  const counts = await Product.aggregate([{ $match: req.admin ? {} : { status: "published" } }, { $group: { _id: "$brand", n: { $sum: 1 } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ brands: brands.map((b) => ({ ...b, productCount: map.get(String(b._id)) || 0 })) });
});

function brandData(body) {
  return {
    ...(body.name !== undefined ? { name: str(body.name, 120) } : {}),
    ...(body.kind !== undefined ? { kind: ["house", "manufacturer", "distributor"].includes(body.kind) ? body.kind : "manufacturer" } : {}),
    ...(body.country !== undefined ? { country: str(body.country, 60) } : {}),
    ...(body.website !== undefined ? { website: safeUrl(body.website) } : {}),
    ...(body.description !== undefined ? { description: str(body.description, 2000) } : {}),
  };
}

export const createBrand = asyncHandler(async (req, res) => {
  const data = brandData(req.body);
  if (!data.name) throw httpError(400, "Name is required");
  const brand = await Brand.create({ ...data, slug: toSlug(data.name) });
  await audit(req, "create", "brand", brand._id, `Created brand ${brand.name}`);
  res.status(201).json({ brand });
});

export const updateBrand = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw httpError(404, "Brand not found");
  Object.assign(brand, brandData(req.body));
  if (req.body.verified !== undefined) {
    if (!can(req.admin.role, "documents:verify")) throw httpError(403, "Only admins can verify brands");
    brand.verified = Boolean(req.body.verified);
  }
  await brand.save();
  await audit(req, "update", "brand", brand._id, `Updated brand ${brand.name}`);
  res.json({ brand });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  if (await Product.exists({ brand: req.params.id })) throw httpError(409, "Brand is used by products");
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) throw httpError(404, "Brand not found");
  await audit(req, "delete", "brand", brand._id, `Deleted brand ${brand.name}`);
  res.json({ message: "Brand deleted" });
});

// ---- documents ----
// Public: only verified documents explicitly marked public.
export const listPublicDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ status: "verified", public: true })
    .select("title type issuer number jurisdiction issuedAt expiresAt file.url file.format summary").sort({ type: 1, issuedAt: -1 }).lean();
  res.json({ documents });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.type) filter.type = String(req.query.type);
  res.json({ documents: await Document.find(filter).sort({ createdAt: -1 }).limit(500).lean(), types: DOCUMENT_TYPES });
});

function documentData(body) {
  const out = {};
  if (body.title !== undefined) out.title = str(body.title, 200);
  if (body.type !== undefined) out.type = DOCUMENT_TYPES.includes(body.type) ? body.type : "other";
  for (const [k, n] of [["issuer", 160], ["number", 120], ["jurisdiction", 80], ["summary", 1000]]) if (body[k] !== undefined) out[k] = str(body[k], n);
  for (const k of ["issuedAt", "expiresAt"]) if (body[k] !== undefined) out[k] = body[k] && !Number.isNaN(Date.parse(body[k])) ? new Date(body[k]) : null;
  if (body.file !== undefined) out.file = { url: safeUrl(body.file?.url), publicId: str(body.file?.publicId, 200), format: str(body.file?.format, 20) };
  if (body.public !== undefined) out.public = Boolean(body.public);
  if (body.products !== undefined) out.products = (Array.isArray(body.products) ? body.products : []).filter(isId).slice(0, 200);
  return out;
}

export const createDocument = asyncHandler(async (req, res) => {
  const data = documentData(req.body);
  if (!data.title || !data.type) throw httpError(400, "Title and type are required");
  const document = await Document.create({ ...data, status: "pending" });
  await audit(req, "create", "document", document._id, `Uploaded ${document.type} document "${document.title}" for verification`);
  res.status(201).json({ document });
});

export const updateDocument = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const document = await Document.findById(req.params.id);
  if (!document) throw httpError(404, "Document not found");
  Object.assign(document, documentData(req.body));
  if (req.body.status !== undefined && req.body.status !== document.status) {
    if (!can(req.admin.role, "documents:verify")) throw httpError(403, "Only admins can change verification status");
    if (!["pending", "verified", "rejected", "expired"].includes(req.body.status)) throw httpError(400, "Invalid status");
    if (req.body.status === "verified" && !document.file?.url) throw httpError(422, "Attach the document file before verifying it");
    document.status = req.body.status;
    document.verifiedBy = req.body.status === "verified" ? req.admin.username : "";
    document.verifiedAt = req.body.status === "verified" ? new Date() : null;
  }
  if (document.public && document.status !== "verified") document.public = false; // never expose unverified evidence
  await document.save();
  await audit(req, "update", "document", document._id, `Updated document "${document.title}" (${document.status}${document.public ? ", public" : ""})`);
  res.json({ document });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const document = await Document.findByIdAndDelete(req.params.id);
  if (!document) throw httpError(404, "Document not found");
  await audit(req, "delete", "document", document._id, `Deleted document "${document.title}"`);
  res.json({ message: "Document deleted" });
});
