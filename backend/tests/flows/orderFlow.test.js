import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { User, Food, Restaurant, Order, Cart } from "../../models/index.cjs";
import { generateToken } from "../helpers.js";
import bcrypt from "bcrypt";

describe("Order Flow: User đặt hàng → Restaurant xác nhận → Giao hàng → Hoàn tất", () => {
  let user, userToken;
  let owner, ownerToken, restaurant, food1, food2;
  let admin, adminToken;

  beforeEach(async () => {
    const hash = await bcrypt.hash("password123", 10);

    admin = await User.create({
      name: "Admin",
      email: "admin@dronedelivery.com",
      password: hash,
      role: "admin",
      balance: 0,
    });
    adminToken = generateToken(admin._id);

    owner = await User.create({
      name: "Restaurant Owner",
      email: "owner@test.com",
      password: hash,
      role: "restaurant_owner",
    });

    restaurant = await Restaurant.create({
      name: "Pho Hanoi",
      owner: owner._id,
      address: "123 Le Loi, HCM",
      phone: "0901234567",
      email: "phohanoi@test.com",
      isLocked: false,
      balance: 0,
    });

    owner.restaurantId = restaurant._id;
    await owner.save();
    ownerToken = generateToken(owner._id);

    food1 = await Food.create({
      name: "Pho Bo",
      description: "Beef noodle soup",
      price: 8,
      image: "pho.jpg",
      category: "soup",
      restaurantId: restaurant._id,
    });

    food2 = await Food.create({
      name: "Bun Cha",
      description: "Grilled pork noodle",
      price: 7,
      image: "buncha.jpg",
      category: "noodle",
      restaurantId: restaurant._id,
    });

    user = await User.create({
      name: "Nguyen Van A",
      email: "vana@test.com",
      password: hash,
      role: "user",
      address: {
        fullName: "Nguyen Van A",
        address: "456 Nguyen Hue, HCM",
        city: "Ho Chi Minh",
        state: "HCM",
        country: "VN",
        zipCode: "70000",
        phone: "0909876543",
      },
    });
    userToken = generateToken(user._id);
  });

  /**
   * Orders are built from the server-side cart, so a test that wants an order
   * must fill the cart first. Returns the /api/order/place response.
   */
  const placeCodOrder = async (quantity = 1) => {
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ itemId: food1._id.toString(), quantity });

    return request(app)
      .post("/api/order/place")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        address: {
          fullName: "Test", address: "123 St", city: "HCM",
          state: "HCM", country: "VN", zipCode: "70000", phone: "0123456789",
        },
        paymentMethod: "COD",
      });
  };

  it("Luồng hoàn chỉnh: thêm giỏ → đặt COD → restaurant xác nhận → giao → user nhận → balance cập nhật", async () => {
    // === Bước 1: User thêm món vào giỏ hàng ===
    let res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ itemId: food1._id.toString() });
    const lineFor = (body, food) =>
      body.items.find((item) => item.foodId === food._id.toString());

    expect(res.body.success).toBe(true);
    expect(lineFor(res.body, food1).quantity).toBe(1);

    res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ itemId: food1._id.toString() });
    expect(lineFor(res.body, food1).quantity).toBe(2);

    res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ itemId: food2._id.toString() });
    expect(lineFor(res.body, food2).quantity).toBe(1);

    // === Bước 2: User đặt hàng COD ===
    const totalPrice = food1.price * 2 + food2.price + 2; // 8*2 + 7 + 2 shipping = 25
    res = await request(app)
      .post("/api/order/place")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items: [
          { _id: food1._id, name: food1.name, quantity: 2, price: food1.price, image: food1.image },
          { _id: food2._id, name: food2.name, quantity: 1, price: food2.price, image: food2.image },
        ],
        address: {
          fullName: "Nguyen Van A",
          address: "456 Nguyen Hue",
          city: "HCM",
          state: "HCM",
          country: "VN",
          zipCode: "70000",
          phone: "0909876543",
        },
        amount: totalPrice,
        paymentMethod: "COD",
        restaurantId: restaurant._id.toString(),
      });
    expect(res.body.success).toBe(true);
    const orderId = res.body.orderId;
    expect(orderId).toBeDefined();

    // Verify: đơn hàng ở trạng thái pending
    let order = await Order.findById(orderId);
    expect(order.orderStatus).toBe("pending");
    expect(order.isPaid).toBe(false);

    // Verify: giỏ hàng đã được xóa
    res = await request(app)
      .get("/api/cart/get")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.body.items).toEqual([]);

    // === Bước 3: Restaurant owner xác nhận đơn (pending → preparing) ===
    res = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ orderId: orderId.toString(), status: "preparing" });
    expect(res.body.success).toBe(true);

    order = await Order.findById(orderId);
    expect(order.orderStatus).toBe("preparing");

    // === Bước 4: Restaurant giao cho drone (preparing → delivering) ===
    res = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ orderId: orderId.toString(), status: "delivering" });
    expect(res.body.success).toBe(true);

    order = await Order.findById(orderId);
    expect(order.orderStatus).toBe("delivering");

    // === Bước 5: User xác nhận nhận hàng (delivering → delivered) ===
    res = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderId: orderId.toString(), status: "delivered" });
    expect(res.body.success).toBe(true);

    order = await Order.findById(orderId);
    expect(order.orderStatus).toBe("delivered");
    expect(order.isDelivered).toBe(true);
    expect(order.deliveredAt).toBeDefined();
    // COD: isPaid tự động = true khi delivered
    expect(order.isPaid).toBe(true);
    expect(order.paidAt).toBeDefined();

    // === Bước 6: Verify balance đã được chia đúng 80/20 ===
    const updatedRestaurant = await Restaurant.findById(restaurant._id);
    const updatedAdmin = await User.findById(admin._id);
    expect(updatedRestaurant.balance).toBe(totalPrice * 0.8);
    expect(updatedAdmin.balance).toBe(totalPrice * 0.2);
  });

  it("User hủy đơn khi pending → đơn bị cancelled, balance không thay đổi", async () => {
    // Đặt hàng
    const res = await placeCodOrder();
    const orderId = res.body.orderId;

    // User hủy đơn khi pending
    const cancelRes = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderId: orderId.toString(), status: "cancelled", reason: "Đổi ý không muốn đặt nữa" });
    expect(cancelRes.body.success).toBe(true);

    // Verify trạng thái
    const order = await Order.findById(orderId);
    expect(order.orderStatus).toBe("cancelled");
    expect(order.reason).toBe("Đổi ý không muốn đặt nữa");

    // Balance không thay đổi
    const updatedRestaurant = await Restaurant.findById(restaurant._id);
    const updatedAdmin = await User.findById(admin._id);
    expect(updatedRestaurant.balance).toBe(0);
    expect(updatedAdmin.balance).toBe(0);
  });

  it("User KHÔNG thể hủy đơn khi đang preparing", async () => {
    const res = await placeCodOrder();
    const orderId = res.body.orderId;

    // Restaurant accept → preparing
    await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ orderId: orderId.toString(), status: "preparing" });

    // User cố hủy → bị từ chối
    const cancelRes = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderId: orderId.toString(), status: "cancelled", reason: "Muốn hủy" });
    expect(cancelRes.body.success).toBe(false);

    // Đơn vẫn ở preparing
    const order = await Order.findById(orderId);
    expect(order.orderStatus).toBe("preparing");
  });

  it("User KHÔNG thể hủy đơn khi đang delivering", async () => {
    const res = await placeCodOrder();
    const orderId = res.body.orderId;

    await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ orderId: orderId.toString(), status: "preparing" });
    await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ orderId: orderId.toString(), status: "delivering" });

    // User cố hủy khi delivering → bị từ chối
    const cancelRes = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderId: orderId.toString(), status: "cancelled", reason: "Muốn hủy" });
    expect(cancelRes.body.success).toBe(false);

    const order = await Order.findById(orderId);
    expect(order.orderStatus).toBe("delivering");
  });

  it("Restaurant owner hủy đơn phải có lý do", async () => {
    const res = await placeCodOrder();
    const orderId = res.body.orderId;

    // Hủy không có lý do → bị từ chối
    let cancelRes = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ orderId: orderId.toString(), status: "cancelled" });
    expect(cancelRes.body.success).toBe(false);
    expect(cancelRes.body.message).toMatch(/[Rr]eason/);

    // Hủy có lý do → thành công
    cancelRes = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ orderId: orderId.toString(), status: "cancelled", reason: "Hết nguyên liệu" });
    expect(cancelRes.body.success).toBe(true);
  });

  it("Không thể nhảy trạng thái: pending → delivering (phải qua preparing)", async () => {
    const res = await placeCodOrder();
    const orderId = res.body.orderId;

    // Cố nhảy pending → delivering
    const skipRes = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ orderId: orderId.toString(), status: "delivering" });
    expect(skipRes.body.success).toBe(false);

    const order = await Order.findById(orderId);
    expect(order.orderStatus).toBe("pending");
  });

  it("User KHÔNG thể xác nhận nhận hàng khi đơn chưa delivering", async () => {
    const res = await placeCodOrder();
    const orderId = res.body.orderId;

    // Cố đánh dấu delivered khi đang pending
    const deliverRes = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ orderId: orderId.toString(), status: "delivered" });
    expect(deliverRes.body.success).toBe(false);
  });

  it("User A KHÔNG thể thao tác trên đơn của User B", async () => {
    const hash = await bcrypt.hash("password123", 10);
    const userB = await User.create({
      name: "User B",
      email: "userb@test.com",
      password: hash,
      role: "user",
    });
    const userBToken = generateToken(userB._id);

    // User A đặt hàng
    const res = await placeCodOrder();
    const orderId = res.body.orderId;

    // User B cố hủy đơn của User A → bị từ chối
    const cancelRes = await request(app)
      .post("/api/order/status")
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ orderId: orderId.toString(), status: "cancelled", reason: "Hack" });
    expect(cancelRes.body.success).toBe(false);
    expect(cancelRes.body.message).toMatch(/[Uu]nauthorized/);
  });
});

describe("Cart Flow: Chỉ được đặt món từ 1 nhà hàng", () => {
  let user, token, restaurant1, restaurant2, food1, food2;

  beforeEach(async () => {
    const hash = await bcrypt.hash("password123", 10);
    user = await User.create({ name: "Cart User", email: "cartflow@test.com", password: hash });
    token = generateToken(user._id);

    const owner = await User.create({ name: "Owner", email: "ownerflow@test.com", password: hash, role: "restaurant_owner" });

    restaurant1 = await Restaurant.create({
      name: "Restaurant 1", owner: owner._id, address: "A St",
      phone: "0123", email: "r1flow@test.com", isLocked: false,
    });
    restaurant2 = await Restaurant.create({
      name: "Restaurant 2", owner: owner._id, address: "B St",
      phone: "0456", email: "r2flow@test.com", isLocked: false,
    });

    food1 = await Food.create({ name: "F1", description: "d", price: 10, image: "f1.jpg", category: "c", restaurantId: restaurant1._id });
    food2 = await Food.create({ name: "F2", description: "d", price: 15, image: "f2.jpg", category: "c", restaurantId: restaurant2._id });
  });

  it("Thêm món từ nhà hàng khác → bị từ chối → xóa giỏ → thêm lại được", async () => {
    // Thêm món từ restaurant 1
    let res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${token}`)
      .send({ itemId: food1._id.toString() });
    expect(res.body.success).toBe(true);

    // Thêm món từ restaurant 2 → bị từ chối
    res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${token}`)
      .send({ itemId: food2._id.toString() });
    expect(res.body.success).toBe(false);

    // Xóa giỏ hàng
    res = await request(app)
      .post("/api/cart/clear")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.success).toBe(true);

    // Giờ thêm món từ restaurant 2 → thành công
    res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${token}`)
      .send({ itemId: food2._id.toString() });
    expect(res.body.success).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].foodId).toBe(food2._id.toString());
    expect(res.body.items[0].quantity).toBe(1);
  });
});

describe("Auth Flow: Đăng ký → Đăng nhập → Bị khóa → Không vào được", () => {
  it("Luồng hoàn chỉnh: register → login → admin lock → login bị chặn → unlock → login lại", async () => {
    // === Đăng ký ===
    let res = await request(app)
      .post("/api/user/register")
      .send({ name: "New User", email: "flow@test.com", password: "password123" });
    expect(res.body.success).toBe(true);
    const userToken = res.body.token;

    // === Đăng nhập thành công ===
    res = await request(app)
      .post("/api/user/login")
      .send({ email: "flow@test.com", password: "password123" });
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe("user");

    // === Tạo admin và khóa user ===
    const hash = await bcrypt.hash("admin123", 10);
    const admin = await User.create({ name: "Admin", email: "adminflow@test.com", password: hash, role: "admin" });
    const adminToken = generateToken(admin._id);

    const user = await User.findOne({ email: "flow@test.com" });

    res = await request(app)
      .post("/api/user/lock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ id: user._id.toString(), locked: true });
    expect(res.body.success).toBe(true);

    // === User bị khóa → login thất bại ===
    res = await request(app)
      .post("/api/user/login")
      .send({ email: "flow@test.com", password: "password123" });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/locked/i);

    // === User bị khóa → access API thất bại ===
    res = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);

    // === Admin mở khóa ===
    res = await request(app)
      .post("/api/user/lock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ id: user._id.toString(), locked: false });
    expect(res.body.success).toBe(true);

    // === Login lại thành công ===
    res = await request(app)
      .post("/api/user/login")
      .send({ email: "flow@test.com", password: "password123" });
    expect(res.body.success).toBe(true);
  });
});
