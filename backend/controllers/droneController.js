import * as droneService from "../services/droneService.js";

/**
 * Lấy thông tin địa chỉ cho drone delivery
 */
export const getDeliveryAddresses = async (req, res) => {
  const { orderId } = req.params;
  try {
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID required",
      });
    }
    const result = await droneService.getDeliveryAddresses(orderId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error getting delivery addresses",
    });
  }
};

