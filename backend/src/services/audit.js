import AuditLog from "../models/AuditLog.js";

// Audit logging must never break the action being audited.
export async function audit(req, action, entity, entityId = "", summary = "", changes) {
  try {
    await AuditLog.create({
      actor: req?.admin?.username || "system",
      role: req?.admin?.role || "",
      action,
      entity,
      entityId: String(entityId || ""),
      summary: String(summary).slice(0, 500),
      changes,
      ip: req?.ip || "",
    });
  } catch (err) {
    console.error("[audit] failed to record", action, entity, err.message);
  }
}

// Shallow diff of selected fields, for the change history.
export function diff(before, after, fields) {
  const changes = {};
  for (const field of fields) {
    const a = JSON.stringify(before?.[field] ?? null);
    const b = JSON.stringify(after?.[field] ?? null);
    if (a !== b) changes[field] = { from: before?.[field] ?? null, to: after?.[field] ?? null };
  }
  return Object.keys(changes).length ? changes : undefined;
}
