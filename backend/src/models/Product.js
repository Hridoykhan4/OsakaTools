import mongoose from "mongoose";
import { imageSchema, seoSchema } from "./_shared.js";

export const PRODUCT_STATUSES = ["draft", "review", "published", "archived"];

const specSchema = new mongoose.Schema(
  {
    group: { type: String, default: "General", trim: true, maxlength: 80 },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    value: { type: String, required: true, trim: true, maxlength: 300 },
    unit: { type: String, default: "", trim: true, maxlength: 30 },
    filterable: { type: Boolean, default: false },
  },
  { _id: false }
);

const documentRefSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    kind: { type: String, enum: ["datasheet", "manual", "certificate", "test-report", "regulatory", "other"], default: "datasheet" },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "" },
    public: { type: Boolean, default: true },
  },
  { _id: false }
);

const marketSchema = new mongoose.Schema(
  {
    region: { type: String, required: true, trim: true, maxlength: 60 },
    authority: { type: String, default: "", trim: true, maxlength: 80 },
    registrationNo: { type: String, default: "", trim: true, maxlength: 120 },
    status: { type: String, enum: ["not-applicable", "pending", "registered", "not-eligible"], default: "pending" },
    evidence: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 240 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: "", maxlength: 500 },
    description: { type: String, default: "", maxlength: 20000 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null, index: true },
    // The real maker. Never replaced by the OSAKA TOOL house brand without private-label evidence.
    manufacturer: { type: String, default: "", trim: true, maxlength: 120 },
    modelNumber: { type: String, default: "", trim: true, maxlength: 120, index: true },
    sku: { type: String, default: "", trim: true, maxlength: 120, index: true },
    gtin: { type: String, default: "", trim: true, maxlength: 20 },
    countryOfOrigin: { type: String, default: "", trim: true, maxlength: 60 },
    originVerified: { type: Boolean, default: false },
    privateLabel: {
      status: { type: String, enum: ["none", "pending", "approved"], default: "none" },
      evidence: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },
    },
    images: { type: [imageSchema], default: [] },
    specifications: { type: [specSchema], default: [] },
    features: { type: [String], default: [] },
    applications: { type: [String], default: [] },
    inBox: { type: [String], default: [] },
    documents: { type: [documentRefSchema], default: [] },
    certifications: { type: [String], default: [] },
    warranty: { type: String, default: "", maxlength: 120 },
    moq: { type: Number, default: 1, min: 1 },
    leadTime: { type: String, default: "", maxlength: 120 },
    regions: { type: [String], default: [] },
    regulatory: {
      isMedical: { type: Boolean, default: false },
      deviceClass: { type: String, default: "", maxlength: 40 },
      intendedUse: { type: String, default: "", maxlength: 1000 },
      markets: { type: [marketSchema], default: [] },
    },
    seo: { type: seoSchema, default: () => ({}) },
    status: { type: String, enum: PRODUCT_STATUSES, default: "draft", index: true },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    featured: { type: Boolean, default: false, index: true },
    source: {
      system: { type: String, default: "manual" },
      sourceId: { type: String, default: "" },
      url: { type: String, default: "" },
      importedAt: { type: Date, default: null },
      importJob: { type: mongoose.Schema.Types.ObjectId, ref: "ImportJob", default: null },
      contentHash: { type: String, default: "" },
    },
    reviewNotes: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Reasons a product cannot be published yet. Medical devices need at least one
// registered market that is backed by an evidence document.
export function publicationBlockers(p) {
  const blockers = [];
  if (!p.images?.length) blockers.push("At least one product image is required");
  if (!p.manufacturer) blockers.push("Manufacturer is required");
  if (!p.shortDescription && !p.description) blockers.push("A description is required");
  if (p.privateLabel?.status === "pending") blockers.push("Private-label branding is pending documentation");
  if (p.regulatory?.isMedical) {
    const ok = (p.regulatory.markets || []).some((m) => m.status === "registered" && m.evidence);
    if (!ok) blockers.push("Medical device requires a registered market with an evidence document");
  }
  return blockers;
}

productSchema.pre("validate", function syncPublished(next) {
  this.published = this.status === "published";
  if (this.published && !this.publishedAt) this.publishedAt = new Date();
  next();
});

productSchema.index(
  { name: "text", modelNumber: "text", sku: "text", manufacturer: "text", shortDescription: "text", description: "text" },
  { weights: { name: 10, modelNumber: 10, sku: 8, manufacturer: 5, shortDescription: 2, description: 1 }, name: "product_text" }
);
productSchema.index(
  { "source.system": 1, "source.sourceId": 1 },
  { unique: true, partialFilterExpression: { "source.sourceId": { $gt: "" } } }
);
productSchema.index({ status: 1, category: 1, updatedAt: -1 });
productSchema.index({ "specifications.label": 1, "specifications.value": 1 });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
