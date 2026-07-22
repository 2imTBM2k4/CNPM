import * as orderService from "../services/orderService.js";

export const placeOrder = async (req, res) => {
  try {
    const result = await orderService.placeOrder(req.user, req.body);

    const restaurantId = req.body.restaurantId;
    if (req.app.get("io") && restaurantId) {
      req.app
        .get("io")
        .to(`restaurant_${restaurantId}`)
        .emit("newOrder", result.orderId);
    }

    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const verifyOrder = async (req, res) => {
  try {
    const { orderId, success } = req.query;
    const isSuccess = success === true || success === "true";
    const result = await orderService.verifyOrder(orderId, isSuccess);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const userOrders = async (req, res) => {
  try {
    const result = await orderService.userOrders(req.user._id);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const listOrders = async (req, res) => {
  try {
    const result = await orderService.listOrders(req.user);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const result = await orderService.updateStatus(req.user, req.body);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const getStatusStats = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }
  try {
    const result = await orderService.getStatusStats();
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};
