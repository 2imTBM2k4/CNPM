import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import User from "../models/userModel.cjs";
import Restaurant from "../models/restaurantModel.cjs";
import Order from "../models/orderModel.cjs";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// LOGIN USER
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select(
      "+password +role +restaurantId"
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

    // Check restaurant lock for restaurant_owner
    if (user.role === "restaurant_owner" && user.restaurantId) {
      const restaurant = await Restaurant.findById(user.restaurantId)
        .select("isLocked")
        .lean();
      if (!restaurant) {
        return res
          .status(404)
          .json({ success: false, message: "Restaurant not found" });
      }
      if (restaurant.isLocked) {
        return res.status(403).json({
          success: false,
          message:
            "Your restaurant account is pending admin approval. Please wait for approval.",
        });
      }
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
      address: {
        // SỬA: Lưu địa chỉ và tên đầy đủ vào đối tượng lồng nhau
        fullName: name, // Sử dụng tên đăng ký làm tên đầy đủ mặc định
        address: address, // Lưu địa chỉ
        phone: phone,
      },
    });

    await newUser.save();
    const token = createToken(newUser._id);

    if (role === "restaurant_owner") {
      const newRestaurant = new Restaurant({
        name: restaurantName,
        owner: newUser._id,
        address: newUser.address.address, // SỬA: Lấy địa chỉ từ đối tượng lồng nhau
        phone: newUser.phone,
        email: email,
        isLocked: true, // Lock by default, waiting for admin approval
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

// LOGOUT USER
export const logoutUser = async (req, res) => {
  try {
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Error during logout" });
  }
};

// GET ME (PROFILE)
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "No user in request" });
    }
    const user = await User.findById(req.user._id).select("-password").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.restaurantId) user.restaurantId = user.restaurantId.toString();
    // SỬA: Trả về user trực tiếp trong data để nhất quán
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("GetMe error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE USER ADDRESS
export const updateUserAddress = async (req, res) => {
  try {
    const { fullName, phone, address, city, state, country, zipCode } =
      req.body;
    const updateData = {
      "address.fullName": fullName,
      "address.phone": phone,
      "address.address": address,
      "address.city": city,
      "address.state": state,
      "address.country": country,
      "address.zipCode": zipCode,
    }; // Logic này bây giờ đã đúng với model mới
    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    })
      .select("-password")
      .lean();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updateData = { name, email, phone };
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email });
      if (existing)
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    })
      .select("-password")
      .lean();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOCK USER (admin) - ✅ SỬA: Nhận { id, locked } thay vì { userId, lock }
export const lockUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    // ✅ Hỗ trợ cả 2 format tham số
    const userId = req.body.id || req.body.userId;
    const locked =
      req.body.locked !== undefined ? req.body.locked : req.body.lock;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or id parameter",
      });
    }

    if (locked === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing locked or lock parameter",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { locked: locked },
      { new: true }
    ).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: `User ${locked ? "locked" : "unlocked"}`,
      data: user,
    });
  } catch (error) {
    console.error("Lock user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// LIST USERS (admin)
export const listUsers = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    const users = await User.find({}).select("-password").lean();
    users.forEach((u) => {
      if (u.restaurantId) u.restaurantId = u.restaurantId.toString();
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE USER BY ADMIN
export const updateUserByAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    const { userId, ...updates } = req.body;
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const user = await User.findByIdAndUpdate(userId, updates, { new: true })
      .select("-password")
      .lean();
    if (user.restaurantId) user.restaurantId = user.restaurantId.toString();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE USER (admin)
export const deleteUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    const { userId } = req.body;
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET STATS
export const getStats = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }
  try {
    const { period = "day" } = req.query;

    const [userCount, restaurantCount, completedOrdersCount] =
      await Promise.all([
        User.countDocuments(),
        Restaurant.countDocuments(),
        Order.countDocuments({ orderStatus: "delivered" }),
      ]);

    const groupFormat = period === "month" ? "%Y-%m" : "%Y-%m-%d";

    const revenue = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$deliveredAt" } },
          totalRevenue: { $sum: { $multiply: ["$totalPrice", 0.2] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const completedSeries = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$deliveredAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        userCount,
        restaurantCount,
        completedOrdersCount,
        revenue,
        completedSeries,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
