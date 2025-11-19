const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    description: { type: String },
    image: { type: String },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    balance: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: true }, // SỬA: Default true để khóa tài khoản mới (chờ admin duyệt)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
