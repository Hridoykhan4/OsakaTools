import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, default: "system" },
    role: { type: String, default: "" },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: "" },
    summary: { type: String, default: "", maxlength: 500 },
    changes: { type: mongoose.Schema.Types.Mixed, default: undefined },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
