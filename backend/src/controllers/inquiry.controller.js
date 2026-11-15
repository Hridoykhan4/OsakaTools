import Inquiry, { INQUIRY_STATUSES, INQUIRY_TYPES } from "../models/Inquiry.js";
import Organization, { SEGMENTS, organizationKey } from "../models/Organization.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../services/audit.js";
import { EMAIL_RE, escapeRegex, httpError, isId, pageParams, pagination, safeUrl, str } from "../utils/validate.js";

// Public submission for contact, RFQ, sourcing and distribution inquiries.
export const submitInquiry = asyncHandler(async (req, res) => {
  // Honeypot: real users never fill the hidden "website" field.
  if (req.body.website) return res.status(201).json({ message: "Thank you. Our team will reply shortly." });

  const type = INQUIRY_TYPES.includes(req.body.type) ? req.body.type : "contact";
  const data = {
    type,
    name: str(req.body.name, 120), email: str(req.body.email, 200).toLowerCase(), phone: str(req.body.phone, 40),
    company: str(req.body.company, 160), country: str(req.body.country, 80), subject: str(req.body.subject, 200),
    message: str(req.body.message, 5000), sourcePage: str(req.body.sourcePage, 300),
  };
  if (!data.name || !data.email) throw httpError(400, "Name and email are required");
  if (!EMAIL_RE.test(data.email)) throw httpError(400, "Please provide a valid email address");

  const rawItems = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
  if (type === "rfq" && !rawItems.length && !data.message) throw httpError(400, "Add products or describe your requirement");
  if (type !== "rfq" && !data.message) throw httpError(400, "Message is required");
  const ids = rawItems.map((i) => i?.product).filter(isId);
  const known = new Map((await Product.find({ _id: { $in: ids }, status: "published" }).select("name sku modelNumber").lean())
    .map((p) => [String(p._id), p]));
  data.items = rawItems.map((i) => {
    const product = known.get(String(i?.product));
    return {
      product: product?._id || null,
      name: product?.name || str(i?.name, 240),
      sku: product ? product.sku || product.modelNumber : str(i?.sku, 120),
      quantity: Math.min(10000000, Math.max(1, parseInt(i?.quantity, 10) || 1)),
      notes: str(i?.notes, 500),
    };
  }).filter((i) => i.name);

  if (type === "rfq" && !data.items.length && !data.message) throw httpError(400, "Add products or describe your requirement");

  if (data.company) {
    const key = organizationKey(data.company);
    if (key) {
      const org = await Organization.findOneAndUpdate(
        { key },
        { $setOnInsert: { name: data.company, key, country: data.country }, $addToSet: { contacts: { name: data.name, email: data.email, phone: data.phone } } },
        { upsert: true, new: true }
      );
      data.organization = org._id;
    }
  }

  const inquiry = await Inquiry.create(data);
  res.status(201).json({ message: "Thank you. Our team will reply shortly.", id: inquiry._id });
});

export const listInquiries = asyncHandler(async (req, res) => {
  const filter = {};
  if (INQUIRY_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (INQUIRY_TYPES.includes(req.query.type)) filter.type = req.query.type;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(str(req.query.q, 100)), "i");
    filter.$or = [{ name: rx }, { email: rx }, { company: rx }, { subject: rx }];
  }
  const { page, limit, skip } = pageParams(req.query, 25, 100);
  const [inquiries, total, unread, byStatus] = await Promise.all([
    Inquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("organization", "name").lean(),
    Inquiry.countDocuments(filter),
    Inquiry.countDocuments({ read: false }),
    Inquiry.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  res.json({ inquiries, unread, byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.n])), pagination: pagination(page, limit, total) });
});

export const updateInquiry = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw httpError(404, "Inquiry not found");
  const previous = inquiry.status;
  if (INQUIRY_STATUSES.includes(req.body.status)) inquiry.status = req.body.status;
  if (typeof req.body.read === "boolean") inquiry.read = req.body.read;
  if (req.body.assignedTo !== undefined) inquiry.assignedTo = str(req.body.assignedTo, 60);
  if (req.body.note) inquiry.notes.push({ by: req.admin.username, text: str(req.body.note, 2000) });
  await inquiry.save();
  await audit(req, "update", "inquiry", inquiry._id,
    previous !== inquiry.status ? `Inquiry from ${inquiry.email}: ${previous} → ${inquiry.status}` : `Updated inquiry from ${inquiry.email}`);
  res.json({ inquiry });
});

export const deleteInquiry = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw httpError(400, "Invalid id");
  const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) throw httpError(404, "Inquiry not found");
  await audit(req, "delete", "inquiry", inquiry._id, `Deleted inquiry from ${inquiry.email}`);
  res.json({ message: "Inquiry deleted" });
});

// ---- organizations ----
export const listOrganizations = asyncHandler(async (req, res) => {
  const filter = req.query.q ? { name: new RegExp(escapeRegex(str(req.query.q, 100)), "i") } : {};
  const organizations = await Organization.find(filter).sort({ updatedAt: -1 }).limit(300).lean();
  const counts = await Inquiry.aggregate([{ $match: { organization: { $in: organizations.map((o) => o._id) } } },
    { $group: { _id: "$organization", n: { $sum: 1 }, last: { $max: "$createdAt" } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c]));
  res.json({
    segments: SEGMENTS,
    organizations: organizations.map((o) => ({ ...o, inquiryCount: map.get(String(o._id))?.n || 0, lastInquiryAt: map.get(String(o._id))?.last || null })),
  });
});

export const upsertOrganization = asyncHandler(async (req, res) => {
  const name = str(req.body.name, 160);
  const data = {
    ...(name ? { name, key: organizationKey(name) } : {}),
    ...(req.body.country !== undefined ? { country: str(req.body.country, 80) } : {}),
    ...(req.body.website !== undefined ? { website: safeUrl(req.body.website) } : {}),
    ...(req.body.segment !== undefined ? { segment: SEGMENTS.includes(req.body.segment) ? req.body.segment : "other" } : {}),
    ...(req.body.notes !== undefined ? { notes: str(req.body.notes, 4000) } : {}),
  };
  let org;
  if (req.params.id) {
    if (!isId(req.params.id)) throw httpError(400, "Invalid id");
    org = await Organization.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!org) throw httpError(404, "Organization not found");
  } else {
    if (!name) throw httpError(400, "Name is required");
    org = await Organization.create(data);
  }
  await audit(req, req.params.id ? "update" : "create", "organization", org._id, `${req.params.id ? "Updated" : "Created"} organization ${org.name}`);
  res.status(req.params.id ? 200 : 201).json({ organization: org });
});
