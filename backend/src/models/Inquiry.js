import mongoose from "mongoose";

export const INQUIRY_STATUSES = ["new", "in-progress", "quoted", "won", "lost", "closed", "spam"];
export const INQUIRY_TYPES = ["contact", "rfq", "sourcing", "distribution"];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, required: true, maxlength: 240 },
    sku: { type: String, default: "", maxlength: 120 },
    quantity: { type: Number, default: 1, min: 1, max: 10000000 },
    notes: { type: String, default: "", maxlength: 500 },
  },
  { _id: false }
);

const inquirySchema = new mongoose.Schema(
  {
    type: { type: String, enum: INQUIRY_TYPES, default: "contact", index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, default: "", maxlength: 40 },
    company: { type: String, default: "", maxlength: 160 },
    country: { type: String, default: "", maxlength: 80 },
    subject: { type: String, default: "", maxlength: 200 },
    message: { type: String, default: "", maxlength: 5000 },
    items: { type: [itemSchema], default: [] },
    status: { type: String, enum: INQUIRY_STATUSES, default: "new", index: true },
    read: { type: Boolean, default: false },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    assignedTo: { type: String, default: "" },
    notes: { type: [{ by: String, text: String, at: { type: Date, default: Date.now } }], default: [] },
    sourcePage: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true }
);

inquirySchema.index({ createdAt: -1 });

export default mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);
