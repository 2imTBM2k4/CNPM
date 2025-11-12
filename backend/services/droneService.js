import * as orderRepo from "../repositories/orderRepository.js";
import * as restaurantRepo from "../repositories/restaurantRepository.js";

/**
 * Lấy thông tin địa chỉ đầy đủ cho drone delivery
 * @param {string} orderId - ID của đơn hàng
 * @returns {Promise<Object>} Thông tin địa chỉ restaurant và customer
 */
export const getDeliveryAddresses = async (orderId) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // Get restaurant - có thể đã được populate hoặc chưa
  let restaurant;
  if (order.restaurantId && typeof order.restaurantId === 'object' && order.restaurantId._id) {
    // Đã được populate
    restaurant = order.restaurantId;
  } else {
    // Chưa được populate, cần fetch
    restaurant = await restaurantRepo.findById(order.restaurantId);
  }
  
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  // Lấy địa chỉ customer từ shippingAddress
  const customerAddress = order.shippingAddress;
  if (!customerAddress) {
    throw new Error("Customer address not found");
  }

  // Tạo địa chỉ đầy đủ cho customer
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
 * @param {string} orderId - ID của đơn hàng
 * @returns {Promise<boolean>} True nếu có thể bắt đầu
 */
export const canStartDelivery = async (orderId) => {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    return false;
  }
  return order.orderStatus === "delivering";
};

