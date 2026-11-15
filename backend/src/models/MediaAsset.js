import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "", index: true },
    kind: { type: String, enum: ["image", "document"], default: "image" },
    format: { type: String, default: "" },
    bytes: { type: Number, default: 0 },
    originalName: { type: String, default: "" },
    uploadedBy: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.MediaAsset || mongoose.model("MediaAsset", mediaAssetSchema);
