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
    isLocked: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Middleware ngăn xóa nhà hàng khi đã có order (bất kể trạng thái)
restaurantSchema.pre(["deleteOne", "findOneAndDelete"], async function (next) {
  const Order = require("./orderModel.cjs");
  const filter = this.getFilter();
  const restaurantId = filter._id;

  if (!restaurantId) return next();

  const totalOrders = await Order.countDocuments({ restaurantId });

  if (totalOrders > 0) {
    const error = new Error(
      `Không thể xóa nhà hàng. Nhà hàng này đã có ${totalOrders} đơn hàng trong hệ thống.`
    );
    error.name = "RestaurantDeleteError";
    return next(error);
  }

  next();
});

// Middleware cho deleteMany
restaurantSchema.pre("deleteMany", async function (next) {
  const Order = require("./orderModel.cjs");
  const filter = this.getFilter();

  const totalOrders = await Order.countDocuments({
    restaurantId: { $in: filter._id?.$in || [filter._id] },
  });

  if (totalOrders > 0) {
    const error = new Error(
      `Không thể xóa nhà hàng. Có ${totalOrders} đơn hàng liên quan.`
    );
    error.name = "RestaurantDeleteError";
    return next(error);
  }

  next();
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
