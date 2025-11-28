import Stripe from "stripe";
import bcrypt from "bcrypt";
import * as orderRepo from "../repositories/orderRepository.js";
import * as restaurantRepo from "../repositories/restaurantRepository.js";
import * as userRepo from "../repositories/userRepository.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getRandomCoordinates = () => {
  const minLat = 10.3695;
  const maxLat = 11.163114;
  const minLng = 106.354983;
  const maxLng = 107.012085;

  const lat = Math.random() * (maxLat - minLat) + minLat;
  const lng = Math.random() * (maxLng - minLng) + minLng;

  return { lat, lng };
};

export const placeOrder = async (user, orderData) => {
  const { items, address, amount, paymentMethod, restaurantId, paymentDetails } = orderData;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty. Please add items to your cart.");
  }
  if (!address) {
    throw new Error("Shipping address is required.");
  }
  if (typeof amount !== "number" || isNaN(amount)) {
    throw new Error("Invalid total amount.");
  }
  if (!restaurantId) {
    throw new Error("Restaurant ID is required.");
  }

  const restaurantLocation = getRandomCoordinates();
  const customerLocation = getRandomCoordinates();

  const newOrderData = {
    user: user._id,
    orderItems: items.map((item) => ({
      product: item._id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    })),
    shippingAddress: {
      fullName: address.fullName,
      address: address.address,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      phone: address.phone,
    },
    paymentMethod,
    totalPrice: amount,
    restaurantId: restaurantId,
    isPaid: paymentMethod === "PayPal" && paymentDetails ? true : false,
    paidAt: paymentMethod === "PayPal" && paymentDetails ? Date.now() : null,
    orderStatus: "pending",
    restaurantLocation,
    customerLocation,
    droneLocation: restaurantLocation,
    ...(paymentDetails?.paypalOrderId && { 
      paypalOrderId: paymentDetails.paypalOrderId 
    }),
    ...(paymentDetails && {
      paymentResult: {
        id: paymentDetails.paypalOrderId,
        status: paymentDetails.paypalStatus,
        email_address: paymentDetails.paypalPayerId,
      }
    }),
  };
  const newOrder = await orderRepo.create(newOrderData);
  await userRepo.updateById(user._id, { cart: [] });

  let sessionUrl = null;
  
  if (paymentMethod === "Stripe") {
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
    sessionUrl = session.url;
  }

  return {
    success: true,
    ...(sessionUrl && { session_url: sessionUrl }),
    orderId: newOrder._id,
    message:
      paymentMethod === "COD"
        ? "Order placed with COD"
        : paymentMethod === "PayPal"
        ? "Order placed with PayPal"
        : "Order created",
  };
};

export const verifyOrder = async (orderId, success) => {
  if (success === "true") {
    await orderRepo.updateById(orderId, { isPaid: true, paidAt: Date.now() });
    return { success: true, message: "Paid" };
  } else {
    await orderRepo.deleteById(orderId);
    return { success: false, message: "Not Paid" };
  }
};

export const userOrders = async (userId) => {
  const orders = await orderRepo.findByUser(userId);
  return { success: true, data: orders };
};

export const listOrders = async (user) => {
  let filter = {};
  if (user.role === "restaurant_owner") {
    filter.restaurantId = user.restaurantId;
  } // else all for admin
  if (user.role !== "restaurant_owner" && user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  const orders = await orderRepo.findAll(filter);
  return { success: true, data: orders };
};

export const updateStatus = async (user, updateData) => {
  const { orderId, status, reason, isPaid, paidAt } = updateData;
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // Tự động gán drone khi chuyển sang trạng thái "delivering"
  if (status === "delivering" && !order.droneId) {
    const droneRepo = await import("../repositories/droneRepository.js");
    const availableDrones = await droneRepo.findAvailable();
    
    if (availableDrones && availableDrones.length > 0) {
      const drone = availableDrones[0];
      
      // Tạo QR code
      const crypto = await import("crypto");
      const hash = crypto.default.createHash("sha256");
      hash.update(`${orderId}-${Date.now()}-${process.env.JWT_SECRET || "secret"}`);
      const qrCode = hash.digest("hex").substring(0, 16).toUpperCase();
      
      // Tính trọng lượng hàng (giả lập: random từ 500g đến 2000g)
      const cargoWeight = Math.floor(Math.random() * 1500) + 500; // 500-2000g
      
      // Cập nhật order với drone và QR code
      order.droneId = drone._id;
      order.qrCode = qrCode;
      await order.save();
      
      // Cập nhật drone với trọng lượng khoang hàng
      drone.status = "delivering";
      drone.currentOrder = orderId;
      drone.cargoWeight = cargoWeight; // Set trọng lượng khi bắt đầu giao
      await drone.save();
    }
  }

  // THAY THẾ TOÀN BỘ PHẦN CHECK CHO ROLE "restaurant_owner" (fallback + auto-fix, FIX: dùng order.restaurantId thay vì order.restaurant)
  if (user.role === "restaurant_owner") {
    if (!order.restaurantId) {
      throw new Error("Unauthorized: Order missing restaurantId");
    }

    // Priority check: user.restaurantId vs order.restaurantId (fast)
    let isAuthorized = false;
    const userRestStr = user.restaurantId ? user.restaurantId.toString() : null;
    const orderRestStr = order.restaurantId._id
      ? order.restaurantId._id.toString()
      : order.restaurantId.toString(); // FIX: Lấy _id từ populated object

    if (userRestStr && userRestStr === orderRestStr) {
      isAuthorized = true;
    } else {
      // Fallback: Check owner từ populated restaurantId (không cần fetch extra, repo đã populate)
      if (order.restaurantId && order.restaurantId.owner) {
        const orderOwnerStr = order.restaurantId.owner._id
          ? order.restaurantId.owner._id.toString()
          : order.restaurantId.owner.toString();

        if (user._id.toString() === orderOwnerStr) {
          isAuthorized = true;
          // Auto-fix user.restaurantId cho lần sau (one-time, chỉ nếu null/mismatch)
          if (
            !user.restaurantId ||
            user.restaurantId.toString() !== order.restaurantId._id.toString()
          ) {
            await userRepo.updateById(user._id, {
              restaurantId: order.restaurantId._id,
            });
            user.restaurantId = order.restaurantId._id.toString(); // Update in-memory
          }
        }
      } else {
        // Nếu chưa populate owner, fetch manual (fallback cuối)
        const fullRestaurant = await restaurantRepo.findById(
          order.restaurantId
        );
        if (fullRestaurant && fullRestaurant.owner) {
          const orderOwnerStr = fullRestaurant.owner._id
            ? fullRestaurant.owner._id.toString()
            : fullRestaurant.owner.toString();

          if (user._id.toString() === orderOwnerStr) {
            isAuthorized = true;
            if (
              !user.restaurantId ||
              user.restaurantId.toString() !== order.restaurantId.toString()
            ) {
              await userRepo.updateById(user._id, {
                restaurantId: order.restaurantId,
              });
              user.restaurantId = order.restaurantId.toString(); // Update in-memory
            }
          }
        }
      }
    }

    if (!isAuthorized) {
      throw new Error(
        `Unauthorized: Not your restaurant (user: ${user._id.toString()}, order: { restaurantId: ${orderRestStr}, owner: ${
          order.restaurantId?.owner?._id || order.restaurantId?.owner
        }})`
      );
    }

    // Validation rules từ gốc (status transitions)
    if (order.orderStatus !== "pending" && status === "preparing") {
      throw new Error("Cannot accept (not pending)");
    }
    if (order.orderStatus !== "preparing" && status === "delivering") {
      throw new Error("Cannot handover (not preparing)");
    }
    if (status === "cancelled" && (!reason || reason.trim() === "")) {
      throw new Error("Reason required for cancellation");
    }
    // ... (tương tự các check khác từ code gốc)
  } else if (user.role === "user") {
    // Kiểm tra quyền sở hữu đơn hàng
    if (order.user._id.toString() !== user._id.toString()) {
      throw new Error("Unauthorized: Not your order");
    }
    
    // User có thể: delivered hoặc cancelled (timeout)
    if (status === "delivered") {
      if (order.orderStatus !== "delivering") {
        throw new Error("Cannot mark received yet (not delivering)");
      }
    } else if (status === "cancelled") {
      // Cho phép user hủy đơn khi timeout (đang ở trạng thái delivering)
      if (order.orderStatus !== "delivering") {
        throw new Error("Cannot cancel order (not delivering)");
      }
      if (!reason || reason.trim() === "") {
        throw new Error("Reason required for cancellation");
      }
    } else {
      throw new Error("Only delivered or cancelled status allowed for users");
    }
  } else if (user.role !== "admin") {
    throw new Error("Unauthorized: Invalid role");
  }

  const updateDataObj = { orderStatus: status };
  if (status === "cancelled" && reason) {
    updateDataObj.reason = reason.trim();
    
    // Giải phóng drone khi đơn hàng bị hủy
    if (order.droneId) {
      const droneRepo = await import("../repositories/droneRepository.js");
      const drone = await droneRepo.findById(order.droneId);
      if (drone) {
        drone.status = "available";
        drone.currentOrder = null;
        drone.cargoWeight = 0;
        drone.cargoLidStatus = "closed";
        await drone.save();
      }
    }
  }

  if (status === "delivered") {
    updateDataObj.isDelivered = true;
    updateDataObj.deliveredAt = Date.now();
    if (isPaid === true) {
      updateDataObj.isPaid = true;
      updateDataObj.paidAt = paidAt || Date.now();
    }

    // Cập nhật drone về trạng thái available
    if (order.droneId) {
      const droneRepo = await import("../repositories/droneRepository.js");
      const drone = await droneRepo.findById(order.droneId);
      if (drone) {
        drone.status = "available";
        drone.currentOrder = null; // Xóa currentOrder
        drone.cargoWeight = 0;
        drone.cargoLidStatus = "closed";
        drone.totalDeliveries += 1;
        await drone.save();
      }
    }

    // Balance update logic từ gốc
    if (!order.isDelivered && updateDataObj.isPaid) {
      const restaurant = await restaurantRepo.findById(order.restaurantId);
      let admin = await userRepo.findAdmin();
      if (!admin) {
        const hashed = await bcrypt.hash("admin123", 10);
        admin = await userRepo.create({
          name: "Admin",
          email: "admin@hangry.com",
          password: hashed,
          role: "admin",
          balance: 0,
        });
      }
      if (restaurant && admin) {
        const restaurantShare = order.totalPrice * 0.8;
        const adminShare = order.totalPrice * 0.2;
        restaurant.balance = (restaurant.balance || 0) + restaurantShare;
        admin.balance = (admin.balance || 0) + adminShare;
        await Promise.all([
          restaurantRepo.updateById(restaurant._id, {
            balance: restaurant.balance,
          }),
          userRepo.updateById(admin._id, { balance: admin.balance }),
        ]);
      }
    }
  }

  await orderRepo.updateById(orderId, updateDataObj);
  return { success: true, message: "Status Updated" };
};

export const getStatusStats = async () => {
  const stats = await orderRepo.aggregateStatusStats();
  if (!stats.length) {
    return {
      success: true,
      data: [
        { name: "Pending", value: 0 },
        { name: "Preparing", value: 0 },
        { name: "Delivering", value: 0 },
        { name: "Delivered", value: 0 },
        { name: "Cancelled", value: 0 },
      ],
    };
  }
  return { success: true, data: stats };
};
