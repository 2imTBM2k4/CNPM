import User from "../models/userModel.cjs";
import Restaurant from "../models/restaurantModel.cjs";
import Order from "../models/orderModel.cjs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// LOGIN USER
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password +role");

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
export const registerUser = async (req, res) => {
  const { name, password, email, role, restaurantName, address, phone } =
    req.body;
  try {
    const exists = await User.findOne({ email });
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
    const hash = await bcrypt.hash(password, salt);

    let newUser = new User({
      name: name,
      email: email,
      password: hash,
      role: role || "user",
      phone,
      address,
    });

    await newUser.save();

    const token = createToken(newUser._id);

    if (role === "restaurant_owner") {
      const newRestaurant = new Restaurant({
        name: restaurantName,
        owner: newUser._id,
        address: newUser.address,
        phone: newUser.phone,
      });
      await newRestaurant.save();
      newUser.restaurantId = newRestaurant._id;
      await newUser.save();
    }

    res.json({ success: true, token });
  } catch (error) {
    console.error("Register error:", error);
    res.json({ success: false, message: "Error" });
  }
};

// LOCK USER
export const lockUser = async (req, res) => {
  try {
    const { userId, lock } = req.body;
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.locked = lock;
    await user.save();
    res.json({
      success: true,
      message: `User ${lock ? "locked" : "unlocked"}`,
    });
  } catch (error) {
    console.error("Lock user error:", error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// GET ME (PROFILE)
export const getMe = async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching user" });
  }
};

// UPDATE USER ADDRESS
export const updateUserAddress = async (req, res) => {
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

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
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

// LIST USERS (ADMIN)
export const listUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({ success: false, message: "Error listing users" });
  }
};

// UPDATE USER BY ADMIN
export const updateUserByAdmin = async (req, res) => {
  try {
    const { userId, ...updates } = req.body;
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");
    if (!updatedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Update user by admin error:", error);
    res.status(500).json({ success: false, message: "Error updating user" });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};

// GET STATS (ADMIN)
export const getStats = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }

  try {
    const { period = "day" } = req.query;
    const userCount = await User.countDocuments();
    const restaurantCount = await Restaurant.countDocuments();
    const completedOrdersCount = await Order.countDocuments({
      orderStatus: "delivered",
    });

    let revenueAggregation;
    if (period === "month") {
      revenueAggregation = await Order.aggregate([
        { $match: { orderStatus: "delivered" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$deliveredAt" } },
            totalRevenue: { $sum: { $multiply: ["$totalPrice", 0.2] } },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    } else {
      revenueAggregation = await Order.aggregate([
        { $match: { orderStatus: "delivered" } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt" },
            },
            totalRevenue: { $sum: { $multiply: ["$totalPrice", 0.2] } },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    }

    res.json({
      success: true,
      data: {
        userCount,
        restaurantCount,
        completedOrdersCount,
        revenue: revenueAggregation,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.json({ success: false, message: "Error fetching stats" });
  }
};

// LOGOUT USER (client-side, but server if needed)
export const logoutUser = async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

// UPDATE PROFILE (user)
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
};
