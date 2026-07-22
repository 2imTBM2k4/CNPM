import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Order } from "../../models/index.cjs";
import {
  createUser,
  createAdmin,
  createRestaurantOwner,
  createFood,
  createOrder,
  generateToken,
} from "../helpers.js";

describe("Order API", () => {
  describe("POST /api/order/place", () => {
    it("should place a COD order", async () => {
      const { owner, restaurant } = await createRestaurantOwner();
      const user = await createUser({ email: "orderer@test.com" });
      const token = generateToken(user._id);
      const food = await createFood(restaurant._id);

      const res = await request(app)
        .post("/api/order/place")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [
            {
              _id: food._id,
              name: food.name,
              quantity: 2,
              price: food.price,
              image: food.image,
            },
          ],
          address: {
            fullName: "Test User",
            address: "123 Test St",
            city: "HCM",
            state: "HCM",
            country: "VN",
            zipCode: "70000",
            phone: "0123456789",
          },
          amount: 22,
          paymentMethod: "COD",
          restaurantId: restaurant._id.toString(),
        });

      expect(res.body.success).toBe(true);
      expect(res.body.orderId).toBeDefined();

      const order = await Order.findById(res.body.orderId);
      expect(order.paymentMethod).toBe("COD");
      expect(order.orderStatus).toBe("pending");
    });

    it("should reject order without items", async () => {
      const user = await createUser({ email: "noitems@test.com" });
      const token = generateToken(user._id);

      const res = await request(app)
        .post("/api/order/place")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [],
          address: { fullName: "Test", address: "123", city: "HCM" },
          amount: 0,
          paymentMethod: "COD",
          restaurantId: "507f1f77bcf86cd799439011",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject order without address", async () => {
      const user = await createUser({ email: "noaddr@test.com" });
      const token = generateToken(user._id);

      const res = await request(app)
        .post("/api/order/place")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ _id: "someid", name: "Food", quantity: 1, price: 10 }],
          amount: 12,
          paymentMethod: "COD",
          restaurantId: "507f1f77bcf86cd799439011",
        });

      expect(res.status).toBe(400);
    });

    it("should require authentication", async () => {
      const res = await request(app).post("/api/order/place").send({});
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/order/userorders", () => {
    it("should return user orders", async () => {
      const { restaurant } = await createRestaurantOwner();
      const user = await createUser({ email: "myorders@test.com" });
      const token = generateToken(user._id);

      await createOrder(user._id, restaurant._id);
      await createOrder(user._id, restaurant._id);

      const res = await request(app)
        .get("/api/order/userorders")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it("should not return other users orders", async () => {
      const { restaurant } = await createRestaurantOwner();
      const user1 = await createUser({ email: "user1orders@test.com" });
      const user2 = await createUser({ email: "user2orders@test.com" });

      await createOrder(user1._id, restaurant._id);

      const token2 = generateToken(user2._id);
      const res = await request(app)
        .get("/api/order/userorders")
        .set("Authorization", `Bearer ${token2}`);

      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("GET /api/order/list", () => {
    it("should allow admin to list all orders", async () => {
      const admin = await createAdmin();
      const token = generateToken(admin._id);
      const { restaurant } = await createRestaurantOwner();

      await createOrder(admin._id, restaurant._id);

      const res = await request(app)
        .get("/api/order/list")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should reject regular user", async () => {
      const user = await createUser({ email: "notadmin@test.com" });
      const token = generateToken(user._id);

      const res = await request(app)
        .get("/api/order/list")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/order/status", () => {
    it("should allow admin to update order status", async () => {
      const admin = await createAdmin();
      const token = generateToken(admin._id);
      const { restaurant } = await createRestaurantOwner();
      const order = await createOrder(admin._id, restaurant._id);

      const res = await request(app)
        .post("/api/order/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: order._id.toString(), status: "preparing" });

      expect(res.body.success).toBe(true);

      const updated = await Order.findById(order._id);
      expect(updated.orderStatus).toBe("preparing");
    });

    it("should require orderId and status", async () => {
      const admin = await createAdmin();
      const token = generateToken(admin._id);

      const res = await request(app)
        .post("/api/order/status")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should require reason for cancellation by restaurant owner", async () => {
      const { owner, restaurant } = await createRestaurantOwner();
      const token = generateToken(owner._id);
      const order = await createOrder(owner._id, restaurant._id);

      const res = await request(app)
        .post("/api/order/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: order._id.toString(), status: "cancelled" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/[Rr]eason/);
    });
  });
});
