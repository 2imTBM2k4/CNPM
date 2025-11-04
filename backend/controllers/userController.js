import userModel from "../models/userModel.cjs";
import restaurantModel from "../models/restaurantModel.cjs";
import orderModel from "../models/orderModel.cjs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// LOGIN USER - FIX: Đảm bảo return role
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Tìm user và select đầy đủ các field cần thiết
    const user = await userModel.findOne({ email }).select("+password +role"); // Explicit select password và role

    console.log("Login attempt for:", email);
    console.log(
      "User found:",
      user
        ? {
            id: user._id,
            email: user.email,
            role: user.role,
            locked: user.locked,
          }
        : "Not found"
    );

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist." });
    }

    if (user.locked) {
      return res.json({ success: false, message: "Account is locked." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id);
    const userRole = user.role || "user";

    console.log("Login successful - Role:", userRole);

    // Return đầy đủ thông tin
    res.json({
      success: true,
      token,
      role: userRole,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.json({ success: false, message: "Error during login" });
  }
};

// REGISTER USER
const registerUser = async (req, res) => {
  const { name, password, email, role, restaurantName, address, phone } =
    req.body;
  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists." });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email.",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: role === "restaurant_owner" ? restaurantName : name,
      email,
      password: hashedPassword,
      role: role || "user",
      phone,
      address: { street: address },
    });

    const user = await newUser.save();

    if (role === "restaurant_owner") {
      const newRestaurant = new restaurantModel({
        name: restaurantName,
        address,
        phone,
        owner: user._id,
      });
      await newRestaurant.save();
      user.restaurantId = newRestaurant._id;
      await user.save();
    }

    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.json({ success: false, message: "Error during registration" });
  }
};

// LIST USERS (Admin only)
const listUsers = async (req, res) => {
  console.log("listUsers called by user role:", req.user.role);

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }

  try {
    const users = await userModel.find({}).select("-password").lean();

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("List users error:", error);
    res.json({ success: false, message: "Error listing users" });
  }
};

// UPDATE USER BY ADMIN
const updateUserByAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }

  try {
    const { id, name, email, role, phone, locked } = req.body;
    const updateData = { name, email, role, phone, locked };

    const updatedUser = await userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select("-password");

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User updated", user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.json({ success: false, message: "Error updating user" });
  }
};

// DELETE USER (Admin only)
const deleteUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }

  try {
    const { id } = req.body;
    const user = await userModel.findById(id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.role === "restaurant_owner" && user.restaurantId) {
      await restaurantModel.findByIdAndDelete(user.restaurantId);
    }

    await userModel.findByIdAndDelete(id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.json({ success: false, message: "Error deleting user" });
  }
};

// LOCK USER (Admin only)
const lockUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }

  try {
    const { id, locked } = req.body;
    const user = await userModel.findByIdAndUpdate(
      id,
      { locked },
      { new: true }
    );

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: locked ? "User locked" : "User unlocked",
    });
  } catch (error) {
    console.error("Lock user error:", error);
    res.json({ success: false, message: "Error updating lock status" });
  }
};

// GET ME (Current user info)
const getMe = async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error("Get me error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching user info" });
  }
};

// UPDATE USER ADDRESS
const updateUserAddress = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user._id;

    if (!address || !address.street || !address.city) {
      return res.json({ success: false, message: "Invalid address data" });
    }

    const updateData = {
      name: name || req.user.name,
      phone: phone || req.user.phone,
      address: {
        ...req.user.address,
        ...address,
      },
    };

    const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: updatedUser,
      message: "Address updated successfully",
    });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ success: false, message: "Error updating address" });
  }
};

// GET STATS (Admin only)
const getStats = async (req, res) => {
  console.log("getStats called by user role:", req.user.role);

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }

  try {
    const userCount = await userModel.countDocuments();
    const restaurantCount = await restaurantModel.countDocuments();
    const completedOrdersCount = await orderModel.countDocuments({
      orderStatus: "delivered",
    });

    res.json({
      success: true,
      data: { userCount, restaurantCount, completedOrdersCount },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.json({ success: false, message: "Error fetching stats" });
  }
};

export {
  loginUser,
  registerUser,
  lockUser,
  getMe,
  updateUserAddress,
  listUsers,
  updateUserByAdmin,
  deleteUser,
  getStats,
};
