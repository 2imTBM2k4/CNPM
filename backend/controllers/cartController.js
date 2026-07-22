import * as cartService from "../services/cartService.js";

export const getCart = async (req, res) => {
  try {
    const result = await cartService.getCart(req.user._id);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const result = await cartService.addToCart(req.user._id, req.body.itemId);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const result = await cartService.removeFromCart(
      req.user._id,
      req.body.itemId
    );
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const result = await cartService.clearCart(req.user._id);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};
