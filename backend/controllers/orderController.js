import orderModel from "../models/orderModel.cjs";
import userModel from "../models/userModel.cjs";
import foodModel from "../models/foodModel.cjs";  // Mới: Để lấy restaurantId từ food
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// placing user order from frontend
const placeOrder = async (req, res) => {
  const frontend_url = "https://hangry-frontend.onrender.com";

  try {
    // Mới: Lấy restaurantId từ item đầu tiên (giả sử all items từ cùng restaurant)
    const firstItem = req.body.items[0];
    const food = await foodModel.findById(firstItem._id);
    if (!food) {
      return res.json({ success: false, message: "Food not found" });
    }

    const newOrder = new orderModel({
      user: req.user._id,  // Sửa: Dùng req.user từ auth
      orderItems: req.body.items.map(item => ({
        product: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      shippingAddress: req.body.address,
      paymentMethod: 'Card',  // Assume, hoặc từ body
      totalPrice: req.body.amount,
      restaurantId: food.restaurantId  // Mới
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.user._id, { cart: [] });  // Xóa cart

    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "pkr",
        product_data: {
          name: item.name
        },
        unit_amount: item.price * 100 * 275
      },
      quantity: item.quantity
    }));

    line_items.push({
      price_data: {
        currency: "pkr",
        product_data: {
          name: "Delivery Charges"
        },
        unit_amount: 2 * 100 * 275
      },
      quantity: 1
    });

    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: 'payment',
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    // Mới: Emit socket event cho restaurant
    req.app.get('io').to(`restaurant_${newOrder.restaurantId}`).emit('newOrder', newOrder);

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
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
      orders = await orderModel.find({ restaurantId: req.user.restaurantId });
    } else if (req.user.role === 'admin') {
      orders = await orderModel.find({});
    } else {
      return res.json({ success: false, message: "Unauthorized" });
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
    const order = await orderModel.findById(req.body.orderId);
    if (!order || (req.user.role === 'restaurant_owner' && order.restaurantId.toString() !== req.user.restaurantId.toString())) {
      return res.json({ success: false, message: "Order not found or unauthorized" });
    }
    await orderModel.findByIdAndUpdate(req.body.orderId, { orderStatus: req.body.status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };