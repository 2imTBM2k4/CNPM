// import Cart from "../models/cartModel.cjs";
// import Food from "../models/foodModel.cjs";

// // GET /api/cart/get
// export const getCart = async (req, res) => {
//   try {
//     let cart = await Cart.findOne({ userId: req.user._id }).populate(
//       "items.foodId"
//     );
//     if (!cart) {
//       cart = await Cart.create({ userId: req.user._id, items: [] });
//     }
//     const cartObj = cart.items.reduce((obj, item) => {
//       obj[item.foodId._id] = item.quantity;
//       return obj;
//     }, {});
//     res.json({ success: true, cartData: cartObj });
//   } catch (err) {
//     console.error("Get cart error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // POST /api/cart/add
// export const addToCart = async (req, res) => {
//   const { itemId } = req.body;
//   try {
//     const food = await Food.findById(itemId);
//     if (!food)
//       return res
//         .status(404)
//         .json({ success: false, message: "Food not found" });

//     let cart = await Cart.findOne({ userId: req.user._id });
//     if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

//     const existing = cart.items.find((i) => i.foodId.toString() === itemId);
//     if (existing) {
//       existing.quantity += 1;
//     } else {
//       cart.items.push({ foodId: itemId, quantity: 1 });
//     }
//     await cart.save();
//     await cart.populate("items.foodId");

//     const cartObj = cart.items.reduce((obj, item) => {
//       obj[item.foodId._id] = item.quantity;
//       return obj;
//     }, {});

//     res.json({ success: true, cartData: cartObj });
//   } catch (err) {
//     console.error("Add to cart error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // POST /api/cart/remove
// export const removeFromCart = async (req, res) => {
//   const { itemId } = req.body;
//   try {
//     const cart = await Cart.findOne({ userId: req.user._id });
//     if (!cart)
//       return res
//         .status(404)
//         .json({ success: false, message: "Cart not found" });

//     const idx = cart.items.findIndex((i) => i.foodId.toString() === itemId);
//     if (idx === -1)
//       return res
//         .status(404)
//         .json({ success: false, message: "Item not in cart" });

//     if (cart.items[idx].quantity > 1) {
//       cart.items[idx].quantity -= 1;
//     } else {
//       cart.items.splice(idx, 1);
//     }
//     await cart.save();
//     await cart.populate("items.foodId");

//     const cartObj = cart.items.reduce((obj, item) => {
//       obj[item.foodId._id] = item.quantity;
//       return obj;
//     }, {});

//     res.json({ success: true, cartData: cartObj });
//   } catch (err) {
//     console.error("Remove from cart error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // POST /api/cart/clear
// export const clearCart = async (req, res) => {
//   try {
//     await Cart.deleteOne({ userId: req.user._id });
//     res.json({ success: true, message: "Cart cleared" });
//   } catch (err) {
//     console.error("Clear cart error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

import * as cartService from "../services/cartService.js";

// GET /api/cart/get
export const getCart = async (req, res) => {
  try {
    const { success, cartData } = await cartService.getCart(req.user._id);
    res.json({ success, cartData });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/cart/add
export const addToCart = async (req, res) => {
  const { itemId } = req.body;
  try {
    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, message: "Item ID required" });
    }
    const result = await cartService.addToCart(req.user._id, itemId);
    res.json(result);
  } catch (err) {
    console.error("Add to cart error:", err);
    const msg = err.message || "";
    const status = msg.includes("not found")
      ? 404
      : msg.includes("một nhà hàng") || msg.includes("one restaurant")
      ? 400
      : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// POST /api/cart/remove
export const removeFromCart = async (req, res) => {
  const { itemId } = req.body;
  try {
    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, message: "Item ID required" });
    }
    const result = await cartService.removeFromCart(req.user._id, itemId);
    res.json(result);
  } catch (err) {
    console.error("Remove from cart error:", err);
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// POST /api/cart/clear
export const clearCart = async (req, res) => {
  try {
    const result = await cartService.clearCart(req.user._id);
    res.json(result);
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
