import mongoose from "mongoose";

export const SEGMENTS = ["distributor", "contractor", "hospital", "laboratory", "industrial", "retail", "other"];

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    // Normalised name used to link inquiries to an existing organization.
    key: { type: String, required: true, unique: true },
    country: { type: String, default: "", maxlength: 80 },
    website: { type: String, default: "", maxlength: 300 },
    segment: { type: String, enum: SEGMENTS, default: "other" },
    contacts: { type: [{ name: String, email: String, phone: String }], default: [] },
    notes: { type: String, default: "", maxlength: 4000 },
  },
  { timestamps: true }
);

export const organizationKey = (name) => String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export default mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
