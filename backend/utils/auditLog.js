import AuditLog from "../models/auditLogModel.cjs";

/**
 * Write one entry to the audit trail.
 *
 * Deliberately swallows its own errors: an audit write must never be the
 * reason a legitimate business action fails. A failure is logged to the
 * server console so it is still visible in operations.
 */
export async function recordAudit({
  actor,
  action,
  targetType,
  targetId,
  reason = "",
  metadata = {},
}) {
  try {
    if (!actor?._id || !action || !targetType || !targetId) return null;

    return await AuditLog.create({
      actor: actor._id,
      actorEmail: actor.email || "",
      actorRole: actor.role || "",
      action,
      targetType,
      targetId,
      reason,
      metadata,
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message, { action });
    return null;
  }
}
