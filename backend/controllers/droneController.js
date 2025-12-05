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

/**
 * Gán drone cho đơn hàng
 */
export const assignDrone = async (req, res) => {
  const { orderId, droneId } = req.body;
  try {
    if (!orderId || !droneId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Drone ID required",
      });
    }
    const result = await droneService.assignDroneToOrder(orderId, droneId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error assigning drone",
    });
  }
};

/**
 * Quét QR code
 */
export const scanQR = async (req, res) => {
  const { orderId, qrCode } = req.body;
  try {
    if (!orderId || !qrCode) {
      return res.status(400).json({
        success: false,
        message: "Order ID and QR code required",
      });
    }
    const result = await droneService.scanQRCode(orderId, qrCode);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error scanning QR code",
    });
  }
};

/**
 * Xác nhận đã nhận hàng
 */
export const confirmDelivery = async (req, res) => {
  const { orderId } = req.body;
  try {
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID required",
      });
    }
    const result = await droneService.confirmDelivery(orderId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error confirming delivery",
    });
  }
};

/**
 * Lấy danh sách tất cả drone (Admin)
 */
export const getAllDrones = async (req, res) => {
  try {
    const result = await droneService.getAllDrones();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error getting drones",
    });
  }
};

/**
 * Tạo drone mới (Admin)
 */
export const createDrone = async (req, res) => {
  try {
    const result = await droneService.createDrone(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error creating drone",
    });
  }
};

/**
 * Cập nhật drone (Admin)
 */
export const updateDrone = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Drone ID required",
      });
    }
    const result = await droneService.updateDrone(id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error updating drone",
    });
  }
};

/**
 * Xóa drone (Admin)
 */
export const deleteDrone = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Drone ID required",
      });
    }
    const result = await droneService.deleteDrone(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error deleting drone",
    });
  }
};

/**
 * Lấy thông tin chi tiết drone
 */
export const getDroneById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Drone ID required",
      });
    }
    const result = await droneService.getDroneById(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error getting drone",
    });
  }
};

/**
 * Cập nhật trọng lượng khoang hàng
 */
export const updateCargoWeight = async (req, res) => {
  const { droneId, weight } = req.body;
  try {
    if (!droneId || weight === undefined) {
      return res.status(400).json({
        success: false,
        message: "Drone ID and weight required",
      });
    }
    const result = await droneService.updateCargoWeight(droneId, weight);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error updating cargo weight",
    });
  }
};

/**
 * Lấy lịch sử giao hàng của drone (Admin)
 */
export const getDroneDeliveryHistory = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Drone ID required",
      });
    }
    const result = await droneService.getDroneDeliveryHistory(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error getting drone delivery history",
    });
  }
};

/**
 * Lấy tất cả lịch sử giao hàng (Admin)
 */
export const getAllDeliveryHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await droneService.getAllDeliveryHistory(page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error getting delivery history",
    });
  }
};
