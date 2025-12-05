import * as orderService from "../services/orderService.js";
import Stripe from "stripe"; // Giữ nếu cần, nhưng push session create xuống service

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Có thể push xuống service

// PLACE ORDER
export const placeOrder = async (req, res) => {
  try {
    const result = await orderService.placeOrder(req.user, req.body);

    // Emit socket nếu có io
    const restaurantId = req.body.restaurantId;
    if (req.app.get("io") && restaurantId) {
      req.app
        .get("io")
        .to(`restaurant_${restaurantId}`)
        .emit("newOrder", result.orderId);
    }
    
    res.json(result);
  } catch (error) {
    console.error("Place order error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error placing order",
    });
  }
};

// VERIFY ORDER
// VERIFY ORDER (chỉ thay phần này, giữ nguyên các export khác)
export const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body || req.query;
  try {
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID required" });
    }
    const isSuccess = success === true || success === "true";
    const result = await orderService.verifyOrder(orderId, isSuccess);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error verifying order",
    });
  }
};
// USER ORDERS
export const userOrders = async (req, res) => {
  try {
    const result = await orderService.userOrders(req.user._id);
    res.json(result);
  } catch (error) {
    console.error("User orders error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user orders",
    });
  }
};

// LIST ORDERS (ADMIN/RESTAURANT)
export const listOrders = async (req, res) => {
  try {
    const result = await orderService.listOrders(req.user);
    res.json(result);
  } catch (error) {
    console.error("List orders error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error listing orders",
    });
  }
};

// UPDATE STATUS
export const updateStatus = async (req, res) => {
  const { orderId, status, reason, isPaid, paidAt } = req.body;
  try {
    if (!orderId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID and status required" });
    }
    const result = await orderService.updateStatus(req.user, {
      orderId,
      status,
      reason,
      isPaid,
      paidAt,
    });
    res.json(result);
  } catch (error) {
    console.error("Update status error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating status",
    });
  }
};

// GET STATUS STATS (ADMIN)
export const getStatusStats = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.json({ success: false, message: "Unauthorized: Admin only" });
  }
  try {
    const result = await orderService.getStatusStats();
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message || "Error" });
  }
};
