import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import * as userRepo from "../repositories/userRepository.js";
import * as restaurantRepo from "../repositories/restaurantRepository.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

export const loginUser = async ({ email, password }) => {
  console.log("loginUser - Data:", { email }); // DEBUG
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new Error("User doesn't exist.");
  }
  if (user.locked) {
    throw new Error("Account is locked.");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  const token = createToken(user._id);
  const userRole = user.role || "user";
  return {
    success: true,
    token,
    role: userRole,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: userRole,
    },
  };
};

export const registerUser = async (userData) => {
  console.log("registerUser - Data:", {
    email: userData.email,
    role: userData.role,
  }); // DEBUG
  const { name, password, email, role, restaurantName, address, phone } =
    userData;
  const exists = await userRepo.findByEmail(email);
  if (exists) {
    throw new Error("User already exists.");
  }
  if (!validator.isEmail(email)) {
    throw new Error("Please enter a valid email.");
  }
  if (password.length < 8) {
    throw new Error("Please enter a strong password.");
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  // FIX: Chuyển address string thành object { street: address } để match schema User.address
  const newUserData = {
    name,
    email,
    password: hash,
    role: role || "user",
    phone,
    address: { street: address }, // FIX: Set street từ address string
  };
  let newUser = await userRepo.create(newUserData);
  const token = createToken(newUser._id);

  if (role === "restaurant_owner") {
    // FIX: Thêm email (dùng email của user cho restaurant)
    const newRestaurantData = {
      name: restaurantName,
      owner: newUser._id,
      address: address, // Restaurant address là string, ok
      phone: newUser.phone,
      email: email, // FIX: Thêm email required
    };
    const newRestaurant = await restaurantRepo.create(newRestaurantData);
    newUser = await userRepo.updateRestaurantForUser(
      newUser._id,
      newRestaurant._id
    );
  }

  return { success: true, token };
};

export const lockUser = async (userId, lock) => {
  console.log("lockUser - Params:", { userId, lock }); // DEBUG
  const user = await userRepo.findById(userId);
  console.log(
    "lockUser - Found user:",
    user ? { _id: user._id, locked: user.locked, role: user.role } : "null"
  ); // DEBUG
  if (!user) {
    throw new Error("User not found");
  }
  await userRepo.updateById(userId, { locked: lock });
  console.log("lockUser - Updated to:", lock); // DEBUG
  return { success: true, message: `User ${lock ? "locked" : "unlocked"}` };
};

export const getMe = (user) => ({ success: true, user });

export const updateUserAddress = async (userId, updates) => {
  const { name, phone, address } = updates;
  if (!address || !address.street || !address.city) {
    throw new Error("Invalid address data");
  }
  const currentUser = await userRepo.findById(userId);
  const updateData = {
    name: name || currentUser.name,
    phone: phone || currentUser.phone,
    address: { ...currentUser.address, ...address },
  };
  const updatedUser = await userRepo.updateById(userId, updateData);
  if (!updatedUser) {
    throw new Error("User not found");
  }
  return {
    success: true,
    user: updatedUser,
    message: "Address updated successfully",
  };
};

export const listUsers = async () => {
  const users = await userRepo.findAll();
  return { success: true, data: users };
};

export const updateUserByAdmin = async (userId, updates) => {
  const updatedUser = await userRepo.updateById(userId, updates);
  if (!updatedUser) {
    throw new Error("User not found");
  }
  return { success: true, data: updatedUser };
};

export const deleteUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  await userRepo.deleteById(userId);
  return { success: true, message: "User deleted successfully" };
};

export const logoutUser = () => ({
  success: true,
  message: "Logged out successfully",
});

export const updateProfile = async (userId, updates) => {
  const user = await userRepo.updateById(userId, updates);
  return { success: true, data: user };
};

export const getStats = async (period = "day") => {
  console.log("getStats - Period:", period);
  const userCount = await userRepo.countDocuments();
  const restaurantCount = await restaurantRepo.countDocuments(); // FIX: Dùng repo đúng
  const completedOrdersCount = await userRepo.countCompletedOrders();
  let revenueAggregation;
  if (period === "month") {
    revenueAggregation = await userRepo.aggregateRevenue("month");
  } else {
    revenueAggregation = await userRepo.aggregateRevenue("day");
  }
  return {
    success: true,
    data: {
      userCount,
      restaurantCount,
      completedOrdersCount,
      revenue: revenueAggregation,
    },
  };
};
