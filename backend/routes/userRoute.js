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
  forgotPassword,
  resetPassword,
  refreshToken,
} from "../controllers/userController.js";

import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  updateAddressSchema,
  updateProfileSchema,
  lockUserSchema,
  updateByAdminSchema,
  deleteUserSchema,
  statsQuerySchema,
} from "../validations/userValidation.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts, please try again after 15 minutes" },
});

const userRouter = express.Router();

// ============ PUBLIC ROUTES ============
userRouter.post("/register", authLimiter, validate(registerSchema), registerUser);
userRouter.post("/login", authLimiter, validate(loginSchema), loginUser);
userRouter.post("/logout", logoutUser);
userRouter.post("/forgot-password", authLimiter, forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/refresh-token", refreshToken);

// ============ PROTECTED ROUTES ============
userRouter.get("/me", protect, getMe);
userRouter.put("/update-address", protect, validate(updateAddressSchema), updateUserAddress);
userRouter.put("/profile", protect, validate(updateProfileSchema), updateProfile);

// ============ ADMIN ROUTES ============
userRouter.get("/list", protect, authorize("admin"), listUsers);
userRouter.get("/stats", protect, authorize("admin"), validate(statsQuerySchema, "query"), getStats);
userRouter.post("/lock", protect, authorize("admin"), validate(lockUserSchema), lockUser);
userRouter.put("/update-by-admin", protect, authorize("admin"), validate(updateByAdminSchema), updateUserByAdmin);
userRouter.delete("/delete", protect, authorize("admin"), validate(deleteUserSchema), deleteUser);

export default userRouter;
