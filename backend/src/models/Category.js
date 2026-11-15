import mongoose from "mongoose";
import { imageSchema, seoSchema } from "./_shared.js";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, default: "", maxlength: 200 },
    description: { type: String, default: "", maxlength: 4000 },
    // Buyer guidance shown on the category page (paragraphs separated by blank lines).
    guide: { type: String, default: "", maxlength: 12000 },
    icon: { type: String, default: "", maxlength: 40 },
    image: { type: imageSchema, default: undefined },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    order: { type: Number, default: 0 },
    isMedical: { type: Boolean, default: false },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

categorySchema.index({ name: "text", description: "text" });

export default mongoose.models.Category || mongoose.model("Category", categorySchema);
