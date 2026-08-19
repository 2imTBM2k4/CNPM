const mongoose = require("mongoose");

/**
 * An append-only trail of privileged actions — who did what, to which record,
 * and why. Real platforms treat this as non-negotiable: without it a staff
 * member can quietly cancel orders, flip roles or mark an order delivered with
 * no way to trace it afterwards.
 *
 * Entries are never updated or deleted by the application.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Copied at write time so the trail still reads correctly if the account
    // is later renamed or removed.
    actorEmail: { type: String, default: "" },
    actorRole: { type: String, default: "" },

    // Dotted verb describing the action, e.g. "order.status_changed".
    action: { type: String, required: true, index: true },

    targetType: {
      type: String,
      enum: ["user", "restaurant", "order", "food", "drone"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

    // Required for anything destructive or overriding — the UI collects it.
    reason: { type: String, default: "" },

    // Free-form context: previous/next values, amounts, etc.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
