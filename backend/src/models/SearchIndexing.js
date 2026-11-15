import mongoose from "mongoose";

const queueSchema = new mongoose.Schema({
  _id: String, revision: { type: String, required: true },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

const stateSchema = new mongoose.Schema({
  _id: String, owner: String,
  leaseUntil: { type: Date, default: () => new Date(0) },
  nextRunAt: { type: Date, default: () => new Date(0) },
  lastAttemptAt: Date, lastReceivedAt: Date, lastStatus: Number,
  message: String, catalogueQueuedAt: Date,
}, { timestamps: true });

export const IndexingQueue = mongoose.models.IndexingQueue || mongoose.model("IndexingQueue", queueSchema);
export const IndexingState = mongoose.models.IndexingState || mongoose.model("IndexingState", stateSchema);
