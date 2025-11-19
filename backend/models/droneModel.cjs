const mongoose = require("mongoose");

const droneSchema = new mongoose.Schema(
  {
    droneCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    cargoWeight: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Trọng lượng khoang hàng (gram) - để kiểm tra khách đã lấy đồ ăn",
    },
    status: {
      type: String,
      enum: ["available", "delivering", "delivered"],
      default: "available",
      comment: "Trạng thái drone: sẵn sàng, đang giao, đã giao",
    },
    cargoLidStatus: {
      type: String,
      enum: ["open", "closed"],
      default: "closed",
      comment: "Trạng thái nắp khoang hàng: đang mở, đang đóng",
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      comment: "Đơn hàng hiện tại đang giao",
    },
    batteryLevel: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      comment: "Mức pin (%)",
    },
    lastMaintenance: {
      type: Date,
      default: Date.now,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
      comment: "Tổng số lần giao hàng",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Drone", droneSchema);
