import { describe, it, expect } from "vitest";
import { User, Food, Cart, Restaurant } from "../../models/index.cjs";
import * as cartService from "../../services/cartService.js";
import bcrypt from "bcrypt";

describe("cartService", () => {
  let user, restaurant, food1, food2, food3;

  beforeEach(async () => {
    user = await User.create({
      name: "Cart User",
      email: "cart@test.com",
      password: await bcrypt.hash("pass123", 10),
    });

    restaurant = await Restaurant.create({
      name: "Restaurant A",
      owner: user._id,
      address: "123 St",
      phone: "0123",
      email: "resta@test.com",
      isLocked: false,
    });

    const restaurant2 = await Restaurant.create({
      name: "Restaurant B",
      owner: user._id,
      address: "456 St",
      phone: "0456",
      email: "restb@test.com",
      isLocked: false,
    });

    food1 = await Food.create({
      name: "Pho",
      description: "Vietnamese soup",
      price: 5,
      image: "pho.jpg",
      category: "soup",
      restaurantId: restaurant._id,
    });

    food2 = await Food.create({
      name: "Bun Bo",
      description: "Spicy noodle",
      price: 6,
      image: "bunbo.jpg",
      category: "noodle",
      restaurantId: restaurant._id,
    });

    food3 = await Food.create({
      name: "Pizza",
      description: "Italian pizza",
      price: 12,
      image: "pizza.jpg",
      category: "pizza",
      restaurantId: restaurant2._id,
    });
  });

  describe("getCart", () => {
    it("should return empty cart for new user", async () => {
      const result = await cartService.getCart(user._id);
      expect(result.success).toBe(true);
      expect(result.cartData).toEqual({});
    });

    it("should return cart with items", async () => {
      await cartService.addToCart(user._id, food1._id.toString());
      const result = await cartService.getCart(user._id);
      expect(result.success).toBe(true);
      expect(result.cartData[food1._id.toString()]).toBe(1);
    });
  });

  describe("addToCart", () => {
    it("should add item to empty cart", async () => {
      const result = await cartService.addToCart(
        user._id,
        food1._id.toString()
      );
      expect(result.success).toBe(true);
      expect(result.cartData[food1._id.toString()]).toBe(1);
    });

    it("should increment quantity when adding same item", async () => {
      await cartService.addToCart(user._id, food1._id.toString());
      const result = await cartService.addToCart(
        user._id,
        food1._id.toString()
      );
      expect(result.cartData[food1._id.toString()]).toBe(2);
    });

    it("should allow adding items from same restaurant", async () => {
      await cartService.addToCart(user._id, food1._id.toString());
      const result = await cartService.addToCart(
        user._id,
        food2._id.toString()
      );
      expect(result.success).toBe(true);
      expect(Object.keys(result.cartData)).toHaveLength(2);
    });

    it("should reject items from different restaurant", async () => {
      await cartService.addToCart(user._id, food1._id.toString());
      await expect(
        cartService.addToCart(user._id, food3._id.toString())
      ).rejects.toThrow();
    });

    it("should throw for non-existent food", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      await expect(cartService.addToCart(user._id, fakeId)).rejects.toThrow(
        "Food not found"
      );
    });
  });

  describe("removeFromCart", () => {
    it("should decrement quantity", async () => {
      await cartService.addToCart(user._id, food1._id.toString());
      await cartService.addToCart(user._id, food1._id.toString());
      const result = await cartService.removeFromCart(
        user._id,
        food1._id.toString()
      );
      expect(result.cartData[food1._id.toString()]).toBe(1);
    });

    it("should remove item when quantity is 1", async () => {
      await cartService.addToCart(user._id, food1._id.toString());
      const result = await cartService.removeFromCart(
        user._id,
        food1._id.toString()
      );
      expect(result.cartData[food1._id.toString()]).toBeUndefined();
    });

    it("should throw when cart not found", async () => {
      const fakeUserId = "507f1f77bcf86cd799439011";
      await expect(
        cartService.removeFromCart(fakeUserId, food1._id.toString())
      ).rejects.toThrow("Cart not found");
    });

    it("should throw when item not in cart", async () => {
      await cartService.addToCart(user._id, food1._id.toString());
      await expect(
        cartService.removeFromCart(user._id, food2._id.toString())
      ).rejects.toThrow("Item not in cart");
    });
  });

  describe("clearCart", () => {
    it("should clear all items", async () => {
      await cartService.addToCart(user._id, food1._id.toString());
      await cartService.addToCart(user._id, food2._id.toString());

      const result = await cartService.clearCart(user._id);
      expect(result.success).toBe(true);

      const cart = await cartService.getCart(user._id);
      expect(cart.cartData).toEqual({});
    });
  });
});
