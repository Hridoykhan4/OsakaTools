// Dashboard analytics, audit log and import jobs.
import Product, { publicationBlockers } from "../models/Product.js";
import Category from "../models/Category.js";
import BlogPost from "../models/BlogPost.js";
import Inquiry from "../models/Inquiry.js";
import Organization from "../models/Organization.js";
import Document from "../models/Document.js";
import AuditLog from "../models/AuditLog.js";
import ImportJob from "../models/ImportJob.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { runImport, SOURCES } from "../services/importService.js";
import { audit } from "../services/audit.js";
import { can } from "../middleware/auth.js";
import { httpError, isId, pageParams, pagination } from "../utils/validate.js";

const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id ?? "none", r.n]));

export const stats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 86400000);
  const [byStatus, byCategory, categories, articles, inquiriesByStatus, inquiriesByType, daily, organizations, documents,
    recent, lastImport, incomplete] = await Promise.all([
    Product.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Product.aggregate([{ $match: { status: "published" } }, { $group: { _id: "$category", n: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "c" } }, { $unwind: "$c" },
      { $project: { name: "$c.name", n: 1 } }, { $sort: { n: -1 } }, { $limit: 8 }]),
    Category.countDocuments(),
    BlogPost.countDocuments({ published: true }),
    Inquiry.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Inquiry.aggregate([{ $group: { _id: "$type", n: { $sum: 1 } } }]),
    Inquiry.aggregate([{ $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, n: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Organization.countDocuments(),
    Document.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    ImportJob.findOne({ mode: "commit" }).sort({ createdAt: -1 }).select("status stats createdAt source").lean(),
    Product.find({ status: { $in: ["draft", "review"] } }).select("name images manufacturer shortDescription description privateLabel regulatory").limit(200).lean(),
  ]);

  const days = [];
  const dailyMap = toMap(daily);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, count: dailyMap[d] || 0 });
  }
  res.json({
    products: { byStatus: toMap(byStatus), byCategory, total: byStatus.reduce((s, r) => s + r.n, 0) },
    categories, articles, organizations,
    inquiries: { byStatus: toMap(inquiriesByStatus), byType: toMap(inquiriesByType), daily: days, open: (toMap(inquiriesByStatus).new || 0) + (toMap(inquiriesByStatus)["in-progress"] || 0) },
    documents: toMap(documents),
    attention: incomplete.map((p) => ({ id: p._id, name: p.name, blockers: publicationBlockers(p) })).filter((p) => p.blockers.length).slice(0, 10),
    lastImport,
    recent: can(req.admin.role, "audit:read") ? recent : [],
  });
});

export const listAudit = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.entity) filter.entity = String(req.query.entity);
  if (req.query.actor) filter.actor = String(req.query.actor);
  const { page, limit, skip } = pageParams(req.query, 50, 200);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), AuditLog.countDocuments(filter),
  ]);
  res.json({ logs, pagination: pagination(page, limit, total) });
});

export const listImports = asyncHandler(async (req, res) => {
  const jobs = await ImportJob.find().sort({ createdAt: -1 }).limit(30).lean();
  res.json({ jobs, sources: Object.keys(SOURCES) });
});

export const getImport = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const job = await ImportJob.findById(req.params.id).lean();
  if (!job) throw httpError(404, "Import job not found");
  res.json({ job });
});

export const startImport = asyncHandler(async (req, res) => {
  const mode = req.body.mode === "commit" ? "commit" : "preview";
  if (mode === "commit" && !can(req.admin.role, "imports:commit")) throw httpError(403, "Only admins can commit imports");
  if (await ImportJob.exists({ status: "running", createdAt: { $gt: new Date(Date.now() - 10 * 60000) } })) {
    throw httpError(409, "Another import is already running");
  }
  const job = await runImport({ source: String(req.body.source || "primegadgets"), mode,
    autoPublish: req.body.autoPublish !== false, actor: req.admin.username });
  await audit(req, `import.${mode}`, "import", job._id,
    `${mode} ${job.source}: ${job.stats.relevant} relevant of ${job.stats.fetched}, ${job.stats.created} created, ${job.stats.errors} errors`);
  res.status(201).json({ job });
});
