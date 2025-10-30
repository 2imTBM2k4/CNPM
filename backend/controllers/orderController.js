import orderModel from "../models/orderModel.cjs";
import userModel from "../models/userModel.cjs";
import foodModel from "../models/foodModel.cjs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  try {
    const { items, address, amount, paymentMethod } = req.body;
    if (!items.length) return res.json({ success: false, message: "No items" });

    // Lấy restaurantId từ item đầu (giả sử cùng restaurant)
    const firstItem = items[0];
    const food = await foodModel.findById(firstItem._id);
    if (!food) return res.json({ success: false, message: "Food not found" });

    const newOrder = new orderModel({
      user: req.user._id,
      orderItems: items.map(item => ({
        product: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      shippingAddress: address,
      paymentMethod,
      totalPrice: amount,
      restaurantId: food.restaurantId,
      isPaid: paymentMethod === 'COD' ? false : true,
      orderStatus: 'pending'  // Fix: Lowercase
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.user._id, { cart: [] });

    if (paymentMethod !== 'COD') {
      const line_items = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.price * 100
        },
        quantity: item.quantity
      }));
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Delivery" },
          unit_amount: 200
        },
        quantity: 1
      });
      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/verify?success=true&orderId=${newOrder._id}`,
        cancel_url: `${process.env.FRONTEND_URL}/verify?success=false&orderId=${newOrder._id}`,
      });
      req.app.get('io').to(`restaurant_${newOrder.restaurantId}`).emit('newOrder', newOrder);
      return res.json({ success: true, session_url: session.url, orderId: newOrder._id });
    } else {
      req.app.get('io').to(`restaurant_${newOrder.restaurantId}`).emit('newOrder', newOrder);
      return res.json({ success: true, orderId: newOrder._id, message: "Order placed with COD" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message || "Error" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success == "true") {
      await orderModel.findByIdAndUpdate(orderId, { isPaid: true, paidAt: Date.now() });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// user orders for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ user: req.user._id });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin panel (filter by role)
const listOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'restaurant_owner') {
      console.log('Fetching orders for restaurantId:', req.user.restaurantId);  // Debug
      orders = await orderModel.find({ restaurantId: req.user.restaurantId });
    } else if (req.user.role === 'admin') {
      orders = await orderModel.find({});
    } else {
      return res.json({ success: false, message: "Unauthorized: Invalid role" });
    }
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// api for updating order status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, reason } = req.body;  // Thêm reason từ body
    console.log('Update status request:', { orderId, status, reason, userRole: req.user?.role, userRestId: req.user?.restaurantId });  // Debug

    const order = await orderModel.findById(orderId);
    if (!order) {
      console.log('Order not found:', orderId);
      return res.json({ success: false, message: "Order not found" });
    }

    console.log('Order restaurantId:', order.restaurantId?.toString() || 'null');

    if (req.user.role === 'restaurant_owner') {
      if (!order.restaurantId) {
        console.log('Order missing restaurantId:', orderId);
        return res.json({ success: false, message: "Order missing restaurant info" });
      }
      if (order.restaurantId.toString() !== req.user.restaurantId) {
        console.log('Restaurant mismatch:', { orderRestId: order.restaurantId.toString(), userRestId: req.user.restaurantId });
        return res.json({ success: false, message: "Unauthorized: Not your order" });
      }
      // Nếu cancelled, yêu cầu reason
      if (status === 'cancelled' && (!reason || reason.trim() === '')) {  // Fix: Lowercase
        return res.json({ success: false, message: "Reason required for cancellation" });
      }
      // Restaurant chỉ allow pending -> preparing/delivering/cancelled (không delivered)
      if (order.orderStatus !== 'pending' && status === 'preparing') {
        return res.json({ success: false, message: "Cannot accept (not pending)" });
      }
      if (order.orderStatus !== 'preparing' && status === 'delivering') {
        return res.json({ success: false, message: "Cannot handover (not preparing)" });
      }
    } else if (req.user.role === 'user') {
      if (status !== 'delivered') {  // Fix: Lowercase
        return res.json({ success: false, message: "Only delivered status allowed for users" });
      }
      if (order.user.toString() !== req.user._id.toString()) {
        return res.json({ success: false, message: "Unauthorized: Not your order" });
      }
      if (order.orderStatus !== 'delivering') {  // Fix: Lowercase
        return res.json({ success: false, message: "Cannot mark received yet (not delivering)" });
      }
    } else if (req.user.role !== 'admin') {
      return res.json({ success: false, message: "Unauthorized: Invalid role" });
    }

    // Update với reason nếu có
    const updateData = { orderStatus: status };
    if (status === 'cancelled' && reason) {  // Fix: Lowercase
      updateData.reason = reason.trim();
    }
    if (status === 'delivered') {
      updateData.isDelivered = true;
      updateData.deliveredAt = Date.now();
    }

    await orderModel.findByIdAndUpdate(orderId, updateData);
    console.log('Status updated successfully:', status, 'Reason:', reason || 'N/A');
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log('Update status error:', error);
    res.json({ success: false, message: error.message || "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };