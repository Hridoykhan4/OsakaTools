import mongoose from "mongoose";

const importJobSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    mode: { type: String, enum: ["preview", "commit"], required: true },
    status: { type: String, enum: ["running", "completed", "failed"], default: "running" },
    startedBy: { type: String, default: "system" },
    stats: {
      fetched: { type: Number, default: 0 },
      relevant: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      unchanged: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },
    },
    items: {
      type: [{ _id: false, sourceId: String, name: String, action: String, category: String, reason: String }],
      default: [],
    },
    errorLog: { type: [{ _id: false, sourceId: String, message: String }], default: [] },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ImportJob || mongoose.model("ImportJob", importJobSchema);
