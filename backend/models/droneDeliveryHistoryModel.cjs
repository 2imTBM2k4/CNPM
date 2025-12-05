const mongoose = require("mongoose");

const droneDeliveryHistorySchema = new mongoose.Schema(
  {
    droneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drone",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantAddress: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["delivering", "delivered", "cancelled"],
      default: "delivering",
    },
    qrCode: { type: String },
    cargoWeight: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

droneDeliveryHistorySchema.index({ droneId: 1, createdAt: -1 });
droneDeliveryHistorySchema.index({ orderId: 1 });

module.exports = mongoose.model("DroneDeliveryHistory", droneDeliveryHistorySchema);
