import orderModel from "../models/orderModel.cjs";
import userModel from "../models/userModel.cjs";
import restaurantModel from "../models/restaurantModel.cjs";
import foodModel from "../models/foodModel.cjs";
import Stripe from "stripe";
import bcrypt from "bcrypt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  try {
    const { items, address, amount, paymentMethod } = req.body;
    if (!items.length) return res.json({ success: false, message: "No items" });

    const firstItem = items[0];
    const food = await foodModel.findById(firstItem._id);
    if (!food) return res.json({ success: false, message: "Food not found" });

    const newOrder = new orderModel({
      user: req.user._id,
      orderItems: items.map((item) => ({
        product: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
      shippingAddress: address,
      paymentMethod,
      totalPrice: amount,
      restaurantId: food.restaurantId,
      isPaid: paymentMethod === "COD" ? false : true,
      orderStatus: "pending",
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.user._id, { cart: [] });

    if (paymentMethod !== "COD") {
      const line_items = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      }));
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Delivery" },
          unit_amount: 200,
        },
        quantity: 1,
      });
      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/verify?success=true&orderId=${newOrder._id}`,
        cancel_url: `${process.env.FRONTEND_URL}/verify?success=false&orderId=${newOrder._id}`,
      });
      req.app
        .get("io")
        .to(`restaurant_${newOrder.restaurantId}`)
        .emit("newOrder", newOrder);
      return res.json({
        success: true,
        session_url: session.url,
        orderId: newOrder._id,
      });
    } else {
      req.app
        .get("io")
        .to(`restaurant_${newOrder.restaurantId}`)
        .emit("newOrder", newOrder);
      return res.json({
        success: true,
        orderId: newOrder._id,
        message: "Order placed with COD",
      });
    }
  } catch (error) {
    console.log("Place order error:", error);
    res.json({ success: false, message: error.message || "Error" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, {
        isPaid: true,
        paidAt: Date.now(),
      });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log("Verify order error:", error);
    res.json({ success: false, message: "Error" });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ user: req.user._id });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log("User orders error:", error);
    res.json({ success: false, message: "Error" });
  }
};

const listOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === "restaurant_owner") {
      orders = await orderModel.find({ restaurantId: req.user.restaurantId });
    } else if (req.user.role === "admin") {
      orders = await orderModel.find({});
    } else {
      return res.json({ success: false, message: "Unauthorized" });
    }
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log("List orders error:", error);
    res.json({ success: false, message: "Error" });
  }
};

// CẬP NHẬT TRẠNG THÁI + CỘNG TIỀN
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, reason } = req.body;
    console.log("UPDATE STATUS CALLED:", {
      orderId,
      status,
      userRole: req.user.role,
    });

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    console.log("Order found:", {
      id: order._id,
      isDelivered: order.isDelivered,
      isPaid: order.isPaid,
      totalPrice: order.totalPrice,
      restaurantId: order.restaurantId,
    });

    // KIỂM TRA QUYỀN
    if (req.user.role === "restaurant_owner") {
      if (order.restaurantId.toString() !== req.user.restaurantId) {
        return res.json({
          success: false,
          message: "Unauthorized: Not your order",
        });
      }
      if (status === "cancelled" && (!reason || reason.trim() === "")) {
        return res.json({
          success: false,
          message: "Reason required for cancellation",
        });
      }
      if (order.orderStatus !== "pending" && status === "preparing") {
        return res.json({
          success: false,
          message: "Cannot accept (not pending)",
        });
      }
      if (order.orderStatus !== "preparing" && status === "delivering") {
        return res.json({
          success: false,
          message: "Cannot handover (not preparing)",
        });
      }
    } else if (req.user.role === "user") {
      if (status !== "delivered") {
        return res.json({
          success: false,
          message: "Only delivered status allowed for users",
        });
      }
      if (order.user.toString() !== req.user._id.toString()) {
        return res.json({
          success: false,
          message: "Unauthorized: Not your order",
        });
      }
      if (order.orderStatus !== "delivering") {
        return res.json({
          success: false,
          message: "Cannot mark received yet (not delivering)",
        });
      }
    } else if (req.user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized: Invalid role",
      });
    }

    const updateData = { orderStatus: status };
    if (status === "cancelled" && reason) {
      updateData.reason = reason.trim();
    }

    // XỬ LÝ KHI DELIVERED
    if (status === "delivered") {
      updateData.isDelivered = true;
      updateData.deliveredAt = Date.now();

      // FRONTEND GỬI isPaid → ƯU TIÊN DÙNG
      if (req.body.isPaid === true) {
        updateData.isPaid = true;
        updateData.paidAt = req.body.paidAt || Date.now();
        console.log("FRONTEND SENT isPaid=true → MARKED PAID");
      }

      // CỘNG TIỀN
      if (!order.isDelivered && updateData.isPaid) {
        console.log("ENTERING BALANCE UPDATE BLOCK");

        const restaurant = await restaurantModel.findById(order.restaurantId);
        let admin = await userModel.findOne({ role: "admin" });

        if (!admin) {
          console.log("NO ADMIN → Creating default");
          const hashed = await bcrypt.hash("admin123", 10);
          admin = new userModel({
            name: "Admin",
            email: "admin@hangry.com",
            password: hashed,
            role: "admin",
            balance: 0,
          });
          await admin.save();
        }

        if (restaurant && admin) {
          const restaurantShare = order.totalPrice * 0.8;
          const adminShare = order.totalPrice * 0.2;

          restaurant.balance = (restaurant.balance || 0) + restaurantShare;
          admin.balance = (admin.balance || 0) + adminShare;

          await Promise.all([restaurant.save(), admin.save()]);
          console.log("BALANCE UPDATED:", { restaurantShare, adminShare });
        }
      } else {
        console.log("SKIPPED BALANCE UPDATE: isPaid not true");
      }
    }

    await orderModel.findByIdAndUpdate(orderId, updateData);
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.error("Update status error:", error);
    res.json({ success: false, message: error.message || "Error" });
  }
};

// THÊM FUNCTION MỚI CHO STATS (chỉ dành cho admin)
const getStatusStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin only" });
    }

    const stats = await orderModel.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: { $capitalize: "$_id" }, // Capitalize cho đẹp, ví dụ: "Pending" -> "Pending"
          value: "$count",
          _id: 0,
        },
      },
    ]);

    // Nếu không có data, fallback giống frontend
    if (!stats.length) {
      return res.json({
        success: true,
        data: [
          { name: "Pending", value: 0 },
          { name: "Preparing", value: 0 },
          { name: "Delivering", value: 0 },
          { name: "Delivered", value: 0 },
          { name: "Cancelled", value: 0 },
        ],
      });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.log("Get status stats error:", error);
    res.json({ success: false, message: "Error" });
  }
};

export {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  getStatusStats,
};
