import * as orderRepo from "../repositories/orderRepository.js";
import * as restaurantRepo from "../repositories/restaurantRepository.js";
import * as droneRepo from "../repositories/droneRepository.js";
import crypto from "crypto";
import DroneDeliveryHistory from "../models/droneDeliveryHistoryModel.cjs";

/**
 * Lấy thông tin địa chỉ đầy đủ cho drone delivery
 */
export const getDeliveryAddresses = async (orderId) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  let restaurant;
  if (order.restaurantId && typeof order.restaurantId === 'object' && order.restaurantId._id) {
    restaurant = order.restaurantId;
  } else {
    restaurant = await restaurantRepo.findById(order.restaurantId);
  }
  
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const customerAddress = order.shippingAddress;
  if (!customerAddress) {
    throw new Error("Customer address not found");
  }

  const customerFullAddress = [
    customerAddress.address,
    customerAddress.city,
    customerAddress.state,
    customerAddress.country,
    customerAddress.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    success: true,
    data: {
      restaurant: {
        name: restaurant.name,
        address: restaurant.address,
      },
      customer: {
        fullName: customerAddress.fullName,
        address: customerFullAddress,
        phone: customerAddress.phone,
      },
      orderId: order._id.toString(),
      orderStatus: order.orderStatus,
    },
  };
};

/**
 * Kiểm tra xem drone có thể bắt đầu giao hàng không
 */
export const canStartDelivery = async (orderId) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return false;
  }
  return order.orderStatus === "delivering";
};

/**
 * Tạo QR code cho đơn hàng
 */
export const generateQRCode = (orderId) => {
  const hash = crypto.createHash("sha256");
  hash.update(`${orderId}-${Date.now()}-${process.env.JWT_SECRET || "secret"}`);
  return hash.digest("hex").substring(0, 16).toUpperCase();
};

/**
 * Gán drone cho đơn hàng và tạo QR code
 * Sau khi gán, bắt đầu đếm ngược 20s timeout
 */
export const assignDroneToOrder = async (orderId, droneId) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const drone = await droneRepo.findById(droneId);
  if (!drone) {
    throw new Error("Drone not found");
  }

  if (drone.status !== "available") {
    throw new Error("Drone is not available");
  }

  const restaurant = await restaurantRepo.findById(order.restaurantId);
  const qrCode = generateQRCode(orderId);
  const cargoWeight = Math.floor(Math.random() * 1500) + 500;

  order.droneId = droneId;
  order.qrCode = qrCode;
  order.orderStatus = "delivering";
  order.droneArrivedAt = new Date();
  await order.save();

  drone.status = "delivering";
  drone.currentOrder = orderId;
  drone.cargoWeight = cargoWeight;
  await drone.save();

  // Lưu lịch sử giao hàng
  const customerAddress = order.shippingAddress;
  await DroneDeliveryHistory.create({
    droneId: drone._id,
    orderId: order._id,
    restaurantId: order.restaurantId,
    customerId: order.user,
    restaurantAddress: restaurant?.address || "N/A",
    customerAddress: `${customerAddress.address}, ${customerAddress.city}, ${customerAddress.state}`,
    customerName: customerAddress.fullName,
    customerPhone: customerAddress.phone,
    startTime: new Date(),
    status: "delivering",
    qrCode,
    cargoWeight,
    totalPrice: order.totalPrice,
  });

  return {
    success: true,
    message: "Drone assigned successfully.",
    data: {
      orderId: order._id,
      droneId: drone._id,
      droneCode: drone.droneCode,
      qrCode,
      cargoWeight,
      timeoutSeconds: 300,
    },
  };
};

/**
 * Xác nhận khách hàng đã quét QR (giả lập drone quét QR của khách)
 * Logic: Khách hàng nhấn nút "Xác nhận đã quét" → Nắp mở 5s
 */
export const scanQRCode = async (orderId, qrCode) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.qrCode) {
    throw new Error("Order does not have QR code");
  }

  if (order.qrCode !== qrCode) {
    throw new Error("Invalid QR code");
  }

  if (order.qrScanned) {
    throw new Error("QR code already scanned");
  }

  // Đánh dấu đã quét QR (khách hàng đã xác nhận)
  order.qrScanned = true;
  order.qrScannedAt = new Date();
  await order.save();

  // Mở nắp khoang hàng của drone
  if (order.droneId) {
    const drone = await droneRepo.findById(order.droneId);
    if (drone) {
      drone.cargoLidStatus = "open";
      await drone.save();

      // Tự động đóng nắp sau 5 giây
      setTimeout(async () => {
        await closeCargoLid(order.droneId, orderId);
      }, 5000);
    }
  }

  return {
    success: true,
    message: "Customer confirmed QR scan. Cargo lid is opening for 5 seconds...",
    data: {
      qrScanned: true,
      qrScannedAt: order.qrScannedAt,
    },
  };
};

/**
 * Đóng nắp khoang hàng
 */
export const closeCargoLid = async (droneId, orderId) => {
  const drone = await droneRepo.findById(droneId);
  if (!drone) {
    return;
  }

  const order = await orderRepo.findById(orderId);
  if (!order) {
    return;
  }

  // Đóng nắp
  drone.cargoLidStatus = "closed";
  
  // Giả lập: Khách hàng đã lấy hàng, trọng lượng giảm về 0
  drone.cargoWeight = 0;
  
  // Đánh dấu đã kiểm tra khoang hàng (trọng lượng = 0)
  order.cargoChecked = true;
  
  await drone.save();
  await order.save();

  return {
    success: true,
    message: "Cargo lid closed",
  };
};

/**
 * Xác nhận đã nhận hàng (khách hàng nhấn nút)
 */
export const confirmDelivery = async (orderId) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.qrScanned) {
    throw new Error("QR code has not been scanned yet");
  }

  if (!order.cargoChecked) {
    throw new Error("Cargo has not been checked yet. Please wait for the lid to close.");
  }

  order.orderStatus = "delivered";
  order.isDelivered = true;
  order.deliveredAt = new Date();
  await order.save();

  if (order.droneId) {
    const drone = await droneRepo.findById(order.droneId);
    if (drone) {
      drone.status = "available";
      drone.currentOrder = null;
      drone.cargoWeight = 0;
      drone.cargoLidStatus = "closed";
      drone.totalDeliveries += 1;
      await drone.save();

      // Cập nhật lịch sử giao hàng
      await DroneDeliveryHistory.findOneAndUpdate(
        { orderId: order._id, droneId: drone._id },
        { status: "delivered", endTime: new Date() }
      );
    }
  }

  return {
    success: true,
    message: "Delivery confirmed successfully. Drone is now available for new orders.",
    data: {
      orderId: order._id,
      deliveredAt: order.deliveredAt,
    },
  };
};

/**
 * Lấy danh sách tất cả drone (Admin)
 */
export const getAllDrones = async () => {
  const drones = await droneRepo.findAll();
  return {
    success: true,
    data: drones,
  };
};

/**
 * Tạo drone mới (Admin)
 */
export const createDrone = async (droneData) => {
  const existingDrone = await droneRepo.findByCode(droneData.droneCode);
  if (existingDrone) {
    throw new Error("Drone code already exists");
  }

  const drone = await droneRepo.create(droneData);
  return {
    success: true,
    message: "Drone created successfully",
    data: drone,
  };
};

/**
 * Cập nhật drone (Admin)
 */
export const updateDrone = async (droneId, updateData) => {
  const drone = await droneRepo.findById(droneId);
  if (!drone) {
    throw new Error("Drone not found");
  }

  // Nếu thay đổi droneCode, kiểm tra trùng
  if (updateData.droneCode && updateData.droneCode !== drone.droneCode) {
    const existingDrone = await droneRepo.findByCode(updateData.droneCode);
    if (existingDrone) {
      throw new Error("Drone code already exists");
    }
  }

  const updatedDrone = await droneRepo.update(droneId, updateData);
  return {
    success: true,
    message: "Drone updated successfully",
    data: updatedDrone,
  };
};

/**
 * Xóa drone (Admin) - Chỉ xóa được nếu chưa giao đơn nào
 */
export const deleteDrone = async (droneId) => {
  const drone = await droneRepo.findById(droneId);
  if (!drone) {
    throw new Error("Drone not found");
  }

  if (drone.status === "delivering") {
    throw new Error("Không thể xóa drone đang giao hàng");
  }

  if (drone.totalDeliveries > 0) {
    throw new Error(`Không thể xóa drone đã hoàn thành ${drone.totalDeliveries} đơn hàng. Drone này có lịch sử giao hàng.`);
  }

  await droneRepo.deleteById(droneId);
  return {
    success: true,
    message: "Drone deleted successfully",
  };
};

/**
 * Lấy thông tin chi tiết drone
 */
export const getDroneById = async (droneId) => {
  const drone = await droneRepo.findById(droneId);
  if (!drone) {
    throw new Error("Drone not found");
  }

  return {
    success: true,
    data: drone,
  };
};

/**
 * [DEPRECATED] Kiểm tra timeout giao hàng (20 giây)
 * NOTE: Hàm này không còn được sử dụng vì timeout được xử lý ở frontend
 * Frontend sẽ gọi API /api/order/status để cập nhật trạng thái khi timeout
 * 
 * Lý do: setTimeout() ở server không đáng tin cậy (server restart sẽ mất timeout)
 */
export const checkDeliveryTimeout = async (orderId) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return;
  }

  // Nếu đã quét QR rồi thì không làm gì
  if (order.qrScanned) {
    return;
  }

  // Nếu chưa quét QR sau 20s → Giao thất bại
  order.orderStatus = "cancelled";
  order.reason = "⏳ Hết thời gian chờ nhận hàng - Drone đã đợi tại điểm giao nhưng không nhận được tín hiệu xác nhận an toàn từ bạn trong thời gian quy định. Đơn hàng đã bị hủy.";
  order.isDelivered = false;
  await order.save();

  // Drone bay về nhà hàng
  if (order.droneId) {
    const drone = await droneRepo.findById(order.droneId);
    if (drone) {
      drone.status = "available";
      drone.currentOrder = null;
      drone.cargoWeight = 0;
      drone.cargoLidStatus = "closed";
      await drone.save();
    }
  }

  console.log(`Order ${orderId} failed: Customer did not receive delivery within 20 seconds`);
};

/**
 * Lấy lịch sử giao hàng của drone (Admin)
 */
export const getDroneDeliveryHistory = async (droneId) => {
  const drone = await droneRepo.findById(droneId);
  if (!drone) {
    throw new Error("Drone not found");
  }

  const history = await DroneDeliveryHistory.find({ droneId })
    .populate("orderId", "orderStatus totalPrice createdAt")
    .populate("restaurantId", "name")
    .populate("customerId", "name email")
    .sort({ createdAt: -1 });

  return {
    success: true,
    data: {
      drone: {
        _id: drone._id,
        droneCode: drone.droneCode,
        totalDeliveries: drone.totalDeliveries,
        status: drone.status,
      },
      history,
    },
  };
};

/**
 * Lấy tất cả lịch sử giao hàng (Admin)
 */
export const getAllDeliveryHistory = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const [history, total] = await Promise.all([
    DroneDeliveryHistory.find()
      .populate("droneId", "droneCode")
      .populate("orderId", "orderStatus totalPrice")
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    DroneDeliveryHistory.countDocuments(),
  ]);

  return {
    success: true,
    data: history,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Cập nhật trọng lượng khoang hàng (giả lập cảm biến)
 */
export const updateCargoWeight = async (droneId, weight) => {
  const drone = await droneRepo.findById(droneId);
  if (!drone) {
    throw new Error("Drone not found");
  }

  drone.cargoWeight = weight;
  await drone.save();

  // Nếu trọng lượng = 0 và nắp đang đóng, đánh dấu đã kiểm tra khoang hàng
  if (weight === 0 && drone.cargoLidStatus === "closed" && drone.currentOrder) {
    const order = await orderRepo.findById(drone.currentOrder);
    if (order) {
      order.cargoChecked = true;
      await order.save();
    }
  }

  return {
    success: true,
    message: "Cargo weight updated",
    data: {
      droneId: drone._id,
      cargoWeight: drone.cargoWeight,
    },
  };
};
