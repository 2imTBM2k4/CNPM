import express from "express";
import {
  registerUser,
  loginUser,
  lockUser,
  getMe,
  updateUserAddress,
  listUsers,
  updateUserByAdmin,
  deleteUser,
  getStats,
  logoutUser,
  updateProfile,
} from "../controllers/userController.js";

import { protect } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts, please try again after 15 minutes" },
});

const userRouter = express.Router();

// ============ PUBLIC ROUTES ============
userRouter.post("/register", authLimiter, registerUser);
userRouter.post("/login", authLimiter, loginUser);
userRouter.post("/logout", logoutUser);

// ============ PROTECTED ROUTES ============
userRouter.get("/me", protect, getMe);
userRouter.put("/update-address", protect, updateUserAddress);
userRouter.put("/profile", protect, updateProfile);

// ============ ADMIN ROUTES ============
userRouter.get("/list", protect, listUsers);
userRouter.get("/stats", protect, getStats);

// QUAN TRỌNG: Đặt route /lock TRƯỚC các route dynamic khác
userRouter.post("/lock", protect, lockUser);

// Các route update và delete
userRouter.put("/update-by-admin", protect, updateUserByAdmin);
userRouter.delete("/delete", protect, deleteUser);

export default userRouter;
