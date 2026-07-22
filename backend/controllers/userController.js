import * as userService from "../services/userService.js";

export const loginUser = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const result = await userService.registerUser(req.body);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const result = userService.logoutUser();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error during logout" });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "No user in request" });
    }
    const result = await userService.getMe(req.user._id);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const updateUserAddress = async (req, res) => {
  try {
    const result = await userService.updateUserAddress(req.user._id, req.body);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const result = await userService.updateProfile(
      req.user._id,
      req.user.email,
      req.body
    );
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const lockUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    const userId = req.body.id || req.body.userId;
    const locked =
      req.body.locked !== undefined ? req.body.locked : req.body.lock;
    const result = await userService.lockUser(userId, locked);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const listUsers = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    const result = await userService.listUsers();
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const updateUserByAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    const { userId, ...updates } = req.body;
    const result = await userService.updateUserByAdmin(userId, updates);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    const result = await userService.deleteUser(req.body.userId);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized: Admin only" });
  }
  try {
    const { period = "day" } = req.query;
    const result = await userService.getStats(period);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};
