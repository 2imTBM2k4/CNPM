const mongoose = require("mongoose");

const shipperProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: {
      type: String,
      enum: ["offline", "available", "assigned", "delivering"],
      default: "offline",
      index: true,
    },
    vehicleType: { type: String, enum: ["motorbike", "bicycle", "car"], default: "motorbike" },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined },
    },
    locationUpdatedAt: { type: Date, default: null },
    pushToken: { type: String, default: "" },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

shipperProfileSchema.index({ currentLocation: "2dsphere" });
shipperProfileSchema.index({ status: 1, locationUpdatedAt: -1 });

module.exports = mongoose.models.ShipperProfile || mongoose.model("ShipperProfile", shipperProfileSchema);
