import mongoose from "mongoose";

export const DOCUMENT_TYPES = [
  "incorporation", "trademark", "certificate", "regulatory", "test-report",
  "datasheet", "manufacturing-agreement", "other",
];

// Company and product evidence. Only verified + public documents appear on the website.
const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    issuer: { type: String, default: "", maxlength: 160 },
    number: { type: String, default: "", maxlength: 120 },
    jurisdiction: { type: String, default: "", maxlength: 80 },
    issuedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    file: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      format: { type: String, default: "" },
    },
    status: { type: String, enum: ["pending", "verified", "rejected", "expired"], default: "pending", index: true },
    public: { type: Boolean, default: false },
    summary: { type: String, default: "", maxlength: 1000 },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    verifiedBy: { type: String, default: "" },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Document || mongoose.model("Document", documentSchema);
