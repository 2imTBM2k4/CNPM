import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import * as userRepo from "../repositories/userRepository.js";
import * as restaurantRepo from "../repositories/restaurantRepository.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

export const loginUser = async ({ email, password }) => {
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

  if (user.role === "restaurant_owner" && user.restaurantId) {
    const restaurant = await restaurantRepo.findById(user.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    if (restaurant.isLocked) {
      throw new Error(
        "Your restaurant account is pending admin approval. Please wait for approval."
      );
    }
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

  const newUserData = {
    name,
    email,
    password: hash,
    role: role || "user",
    phone,
    address: {
      fullName: name,
      address: address,
      phone: phone,
    },
  };
  let newUser = await userRepo.create(newUserData);
  const token = createToken(newUser._id);

  if (role === "restaurant_owner") {
    const newRestaurant = await restaurantRepo.create({
      name: restaurantName,
      owner: newUser._id,
      address: address,
      phone: newUser.phone,
      email: email,
      isLocked: true,
    });
    newUser = await userRepo.updateRestaurantForUser(
      newUser._id,
      newRestaurant._id
    );
  }

  return { success: true, token };
};

export const lockUser = async (userId, lock) => {
  if (!userId) {
    throw new Error("Missing userId parameter");
  }
  if (lock === undefined) {
    throw new Error("Missing lock parameter");
  }
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const updated = await userRepo.updateById(userId, { locked: lock });
  return {
    success: true,
    message: `User ${lock ? "locked" : "unlocked"}`,
    data: updated,
  };
};

export const getMe = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const userObj = user.toObject ? user.toObject() : { ...user };
  if (userObj.restaurantId) {
    userObj.restaurantId = userObj.restaurantId.toString();
  }
  return { success: true, data: userObj };
};

export const updateUserAddress = async (userId, addressData) => {
  const { fullName, phone, address, city, state, country, zipCode } =
    addressData;
  const updateData = {
    "address.fullName": fullName,
    "address.phone": phone,
    "address.address": address,
    "address.city": city,
    "address.state": state,
    "address.country": country,
    "address.zipCode": zipCode,
  };
  const updatedUser = await userRepo.updateById(userId, updateData);
  if (!updatedUser) {
    throw new Error("User not found");
  }
  return { success: true, data: updatedUser };
};

export const listUsers = async () => {
  const users = await userRepo.findAll();
  const usersData = users.map((u) => {
    const obj = u.toObject ? u.toObject() : { ...u };
    if (obj.restaurantId) obj.restaurantId = obj.restaurantId.toString();
    return obj;
  });
  return { success: true, data: usersData };
};

export const updateProfile = async (userId, currentEmail, updates) => {
  const { name, email, phone } = updates;
  if (email && email !== currentEmail) {
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      throw new Error("Email already exists");
    }
  }
  const user = await userRepo.updateById(userId, { name, email, phone });
  return { success: true, data: user };
};

export const updateUserByAdmin = async (userId, updates) => {
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  const updatedUser = await userRepo.updateById(userId, updates);
  if (!updatedUser) {
    throw new Error("User not found");
  }
  const obj = updatedUser.toObject ? updatedUser.toObject() : { ...updatedUser };
  if (obj.restaurantId) obj.restaurantId = obj.restaurantId.toString();
  return { success: true, data: obj };
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

export const getStats = async (period = "day") => {
  const [userCount, restaurantCount, completedOrdersCount] = await Promise.all([
    userRepo.countDocuments(),
    restaurantRepo.countDocuments(),
    userRepo.countCompletedOrders(),
  ]);

  const groupFormat = period === "month" ? "%Y-%m" : "%Y-%m-%d";
  const [revenue, completedSeries] = await Promise.all([
    userRepo.aggregateRevenue(period),
    userRepo.aggregateCompletedSeries(groupFormat),
  ]);

  return {
    success: true,
    data: {
      userCount,
      restaurantCount,
      completedOrdersCount,
      revenue,
      completedSeries,
    },
  };
};
