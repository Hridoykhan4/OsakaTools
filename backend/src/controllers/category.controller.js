import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../services/audit.js";
import { httpError, isId, safeUrl, str, toSlug } from "../utils/validate.js";
import { categoryTreeIds } from "./product.controller.js";

// Published product counts per category, rolled up to every ancestor.
async function withCounts(categories, includeDrafts) {
  const match = includeDrafts ? {} : { status: "published" };
  const raw = await Product.aggregate([{ $match: match }, { $group: { _id: "$category", count: { $sum: 1 } } }]);
  const direct = new Map(raw.map((r) => [String(r._id), r.count]));
  const byId = new Map(categories.map((c) => [String(c._id), { ...c, productCount: 0 }]));
  for (const [id, count] of direct) {
    let node = byId.get(id);
    const seen = new Set();
    while (node && !seen.has(String(node._id))) {
      seen.add(String(node._id));
      node.productCount += count;
      node = node.parent ? byId.get(String(node.parent)) : null;
    }
  }
  return [...byId.values()];
}

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 }).select(req.admin ? "" : "-guide").lean();
  res.json({ categories: await withCounts(categories, Boolean(req.admin)) });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: String(req.params.slug) }).populate("parent", "name slug").lean();
  if (!category) throw httpError(404, "Category not found");
  const [children, ids] = await Promise.all([
    Category.find({ parent: category._id }).sort({ order: 1, name: 1 }).select("-guide").lean(),
    categoryTreeIds(category.slug),
  ]);
  const counted = await withCounts([category, ...children], Boolean(req.admin));
  const productCount = await Product.countDocuments({ category: { $in: ids }, status: "published" });
  res.json({ category: { ...category, productCount }, children: counted.slice(1) });
});

function sanitize(body) {
  const out = {};
  if (body.name !== undefined) out.name = str(body.name, 120);
  for (const [k, n] of [["tagline", 200], ["description", 4000], ["guide", 12000], ["icon", 40]]) if (body[k] !== undefined) out[k] = str(body[k], n);
  if (body.order !== undefined) out.order = parseInt(body.order, 10) || 0;
  if (body.isMedical !== undefined) out.isMedical = Boolean(body.isMedical);
  if (body.parent !== undefined) out.parent = isId(body.parent) ? body.parent : null;
  if (body.image !== undefined) out.image = safeUrl(body.image?.url) ? { url: safeUrl(body.image.url), publicId: str(body.image.publicId, 200), alt: str(body.image.alt, 200) } : undefined;
  if (body.seo !== undefined) out.seo = { title: str(body.seo?.title, 120), description: str(body.seo?.description, 320), canonical: safeUrl(body.seo?.canonical), noindex: Boolean(body.seo?.noindex) };
  return out;
}

async function assertNoCycle(id, parent) {
  let current = parent;
  for (let depth = 0; current && depth < 20; depth++) {
    if (String(current) === String(id)) throw httpError(400, "A category cannot be nested inside itself");
    current = (await Category.findById(current).select("parent").lean())?.parent;
  }
}

export const createCategory = asyncHandler(async (req, res) => {
  const data = sanitize(req.body);
  if (!data.name) throw httpError(400, "Name is required");
  const slug = toSlug(req.body.slug || data.name);
  if (await Category.exists({ slug })) throw httpError(409, "A category with this URL already exists");
  const category = await Category.create({ ...data, slug });
  await audit(req, "create", "category", category._id, `Created category ${category.name}`);
  res.status(201).json({ category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const category = await Category.findById(req.params.id);
  if (!category) throw httpError(404, "Category not found");
  const data = sanitize(req.body);
  if (data.parent) await assertNoCycle(category._id, data.parent);
  Object.assign(category, data); // slug is preserved on rename
  await category.save();
  await audit(req, "update", "category", category._id, `Updated category ${category.name}`);
  res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const [products, children] = await Promise.all([
    Product.countDocuments({ category: req.params.id }), Category.countDocuments({ parent: req.params.id }),
  ]);
  if (products || children) throw httpError(409, `Move its ${products} products and ${children} subcategories first`);
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw httpError(404, "Category not found");
  await audit(req, "delete", "category", category._id, `Deleted category ${category.name}`);
  res.json({ message: "Category deleted" });
});
