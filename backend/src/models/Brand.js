import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    kind: { type: String, enum: ["house", "manufacturer", "distributor"], default: "manufacturer" },
    country: { type: String, default: "", maxlength: 60 },
    website: { type: String, default: "", maxlength: 300 },
    description: { type: String, default: "", maxlength: 2000 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Brand || mongoose.model("Brand", brandSchema);
