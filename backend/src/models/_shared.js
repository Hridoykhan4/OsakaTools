import mongoose from "mongoose";

export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "" },
    alt: { type: String, default: "", maxlength: 200 },
  },
  { _id: false }
);

export const seoSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", maxlength: 120 },
    description: { type: String, default: "", maxlength: 320 },
    canonical: { type: String, default: "", maxlength: 300 },
    noindex: { type: Boolean, default: false },
  },
  { _id: false }
);
