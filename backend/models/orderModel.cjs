const mongoose = require("mongoose");

// Snapshot of a pick at order time — the menu may change afterwards, so the
// surcharge is frozen here rather than looked up again later.
const orderItemOptionSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  optionName: { type: String, required: true },
  priceDelta: { type: Number, default: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Food",
          required: true,
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        image: String,
        selectedOptions: { type: [orderItemOptionSchema], default: [] },
        note: { type: String, default: "" },
      },
    ],
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    paymentMethod: {
      type: String,
      // required: true,
      enum: ["Card", "COD", "PayPal"],
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    taxPrice: {
      type: Number,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "delivering", "delivered", "cancelled"],
      default: "pending",
    },
    reason: {
      type: String,
      default: "",
    },
    stripeSessionId: String,
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    paypalOrderId: {
      // THÊM: Lưu trữ Order ID từ PayPal
      type: String,
      default: null,
    },
    qrCode: {
      type: String,
      default: null,
      comment: "Mã QR để khách hàng xác nhận nhận hàng từ drone",
    },
    qrScanned: {
      type: Boolean,
      default: false,
      comment: "Đã quét QR code chưa",
    },
    qrScannedAt: {
      type: Date,
      default: null,
    },
    droneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drone",
      default: null,
      comment: "Drone được gán để giao đơn hàng này",
    },
    droneArrivedAt: {
      type: Date,
      default: null,
      comment: "Thời điểm drone tới địa chỉ khách hàng",
    },
    cargoChecked: {
      type: Boolean,
      default: false,
      comment: "Đã kiểm tra khoang hàng (trọng lượng + camera)",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
