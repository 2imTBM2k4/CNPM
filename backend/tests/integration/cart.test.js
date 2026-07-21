import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Food, Restaurant } from "../../models/index.cjs";
import { createUser, generateToken } from "../helpers.js";

describe("Cart API", () => {
  let user, token, food1, food2, foodOtherRestaurant;

  beforeEach(async () => {
    user = await createUser({ email: "cartapi@test.com" });
    token = generateToken(user._id);

    const restaurant1 = await Restaurant.create({
      name: "Rest 1",
      owner: user._id,
      address: "123 St",
      phone: "0123",
      email: "r1@test.com",
      isLocked: false,
    });

    const restaurant2 = await Restaurant.create({
      name: "Rest 2",
      owner: user._id,
      address: "456 St",
      phone: "0456",
      email: "r2@test.com",
      isLocked: false,
    });

    food1 = await Food.create({
      name: "Food 1",
      description: "Desc 1",
      price: 10,
      image: "f1.jpg",
      category: "cat1",
      restaurantId: restaurant1._id,
    });

    food2 = await Food.create({
      name: "Food 2",
      description: "Desc 2",
      price: 15,
      image: "f2.jpg",
      category: "cat1",
      restaurantId: restaurant1._id,
    });

    foodOtherRestaurant = await Food.create({
      name: "Food 3",
      description: "Desc 3",
      price: 20,
      image: "f3.jpg",
      category: "cat2",
      restaurantId: restaurant2._id,
    });
  });

  describe("GET /api/cart/get", () => {
    it("should return empty cart", async () => {
      const res = await request(app)
        .get("/api/cart/get")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cartData).toEqual({});
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/cart/get");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/cart/add", () => {
    it("should add item to cart", async () => {
      const res = await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cartData[food1._id.toString()]).toBe(1);
    });

    it("should increment quantity for same item", async () => {
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      const res = await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      expect(res.body.cartData[food1._id.toString()]).toBe(2);
    });

    it("should allow multiple items from same restaurant", async () => {
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      const res = await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food2._id.toString() });

      expect(res.body.success).toBe(true);
      expect(Object.keys(res.body.cartData)).toHaveLength(2);
    });

    it("should reject items from different restaurant", async () => {
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      const res = await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: foodOtherRestaurant._id.toString() });

      expect(res.body.success).toBe(false);
    });

    it("should return 400 when itemId is missing", async () => {
      const res = await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/cart/remove", () => {
    it("should decrement quantity", async () => {
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      const res = await request(app)
        .post("/api/cart/remove")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      expect(res.body.success).toBe(true);
      expect(res.body.cartData[food1._id.toString()]).toBe(1);
    });

    it("should remove item when quantity reaches 0", async () => {
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      const res = await request(app)
        .post("/api/cart/remove")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      expect(res.body.cartData[food1._id.toString()]).toBeUndefined();
    });
  });

  describe("POST /api/cart/clear", () => {
    it("should clear all items", async () => {
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({ itemId: food1._id.toString() });

      const res = await request(app)
        .post("/api/cart/clear")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.success).toBe(true);

      const getRes = await request(app)
        .get("/api/cart/get")
        .set("Authorization", `Bearer ${token}`);

      expect(getRes.body.cartData).toEqual({});
    });
  });
});
