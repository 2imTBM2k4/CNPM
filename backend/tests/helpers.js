import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Food, Restaurant, Cart, Order } from "../models/index.cjs";

export const createUser = async (overrides = {}) => {
  const password = overrides.password || "password123";
  const hash = await bcrypt.hash(password, 10);
  const userData = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: hash,
    role: "user",
    ...overrides,
    password: hash,
  };
  const user = await User.create(userData);
  return user;
};

export const createAdmin = async () => {
  return createUser({ name: "Admin", role: "admin", email: "admin@test.com" });
};

export const createRestaurantOwner = async () => {
  const owner = await createUser({
    name: "Owner",
    role: "restaurant_owner",
    email: `owner-${Date.now()}@test.com`,
  });
  const restaurant = await Restaurant.create({
    name: "Test Restaurant",
    owner: owner._id,
    address: "123 Test St",
    phone: "0123456789",
    email: owner.email,
    isLocked: false,
    lat: 10.7769,
    lng: 106.7009,
  });
  owner.restaurantId = restaurant._id;
  await owner.save();
  return { owner, restaurant };
};

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET);
};

export const createFood = async (restaurantId, overrides = {}) => {
  return Food.create({
    name: "Test Food",
    description: "A delicious test food",
    price: 10,
    image: "http://example.com/food.jpg",
    category: "test",
    restaurantId,
    ...overrides,
  });
};

export const createOrder = async (userId, restaurantId, overrides = {}) => {
  return Order.create({
    user: userId,
    orderItems: [
      {
        product: new (await import("mongoose")).default.Types.ObjectId(),
        name: "Test Food",
        quantity: 1,
        price: 10,
        image: "test.jpg",
      },
    ],
    shippingAddress: {
      fullName: "Test User",
      address: "123 Test St",
      city: "Test City",
      state: "TS",
      country: "VN",
      zipCode: "12345",
      phone: "0123456789",
      lat: 10.7769,
      lng: 106.7009,
    },
    paymentMethod: "COD",
    totalPrice: 12,
    restaurantId,
    orderStatus: "pending",
    ...overrides,
  });
};
