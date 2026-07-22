import * as cartRepo from "../repositories/cartRepository.js";
import AppError from "../utils/AppError.js";

export const getCart = async (userId) => {
  let cart = await cartRepo.findByUserId(userId);
  if (!cart) {
    cart = await cartRepo.create(userId);
  }
  const cartObj = cart.items.reduce((obj, item) => {
    obj[item.foodId._id.toString()] = item.quantity;
    return obj;
  }, {});
  return { success: true, cartData: cartObj };
};

export const addToCart = async (userId, itemId) => {
  const food = await cartRepo.findFoodById(itemId);
  if (!food) {
    throw new AppError("Food not found", 404);
  }

  let cart = await cartRepo.findByUserId(userId);
  if (!cart) {
    cart = await cartRepo.create(userId);
  }

  // Enforce single-restaurant rule: all items must share same restaurantId
  if (cart.items.length > 0) {
    // cart.items.foodId is populated in repository
    const existingRestaurantId = cart.items[0].foodId.restaurantId?.toString();
    const newRestaurantId = food.restaurantId?.toString();
    if (
      existingRestaurantId &&
      newRestaurantId &&
      existingRestaurantId !== newRestaurantId
    ) {
      throw new AppError("Chỉ được đặt món từ một nhà hàng trong mỗi giỏ hàng", 400);
    }
  }

  const existing = cart.items.find((i) => i.foodId._id.toString() === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.push({ foodId: itemId, quantity: 1 });
  }

  const updatedCart = await cartRepo.update(userId, cart.items);
  const cartObj = updatedCart.items.reduce((obj, item) => {
    obj[item.foodId._id.toString()] = item.quantity;
    return obj;
  }, {});
  return { success: true, cartData: cartObj };
};

export const removeFromCart = async (userId, itemId) => {
  let cart = await cartRepo.findByUserId(userId);
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const idx = cart.items.findIndex((i) => i.foodId._id.toString() === itemId);
  if (idx === -1) {
    throw new AppError("Item not in cart", 404);
  }

  if (cart.items[idx].quantity > 1) {
    cart.items[idx].quantity -= 1;
  } else {
    cart.items.splice(idx, 1);
  }

  const updatedCart = await cartRepo.update(userId, cart.items);
  const cartObj = updatedCart.items.reduce((obj, item) => {
    obj[item.foodId._id.toString()] = item.quantity;
    return obj;
  }, {});
  return { success: true, cartData: cartObj };
};

export const clearCart = async (userId) => {
  await cartRepo.deleteByUserId(userId);
  return { success: true, message: "Cart cleared" };
};
