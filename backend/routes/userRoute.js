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

// ============ PROTECTED ROUTES ============
userRouter.get("/me", protect, getMe);
userRouter.put("/update-address", protect, validate(updateAddressSchema), updateUserAddress);
userRouter.put("/profile", protect, validate(updateProfileSchema), updateProfile);

// ============ ADMIN ROUTES ============
userRouter.get("/list", protect, listUsers);
userRouter.get("/stats", protect, validate(statsQuerySchema, "query"), getStats);
userRouter.post("/lock", protect, validate(lockUserSchema), lockUser);
userRouter.put("/update-by-admin", protect, validate(updateByAdminSchema), updateUserByAdmin);
userRouter.delete("/delete", protect, validate(deleteUserSchema), deleteUser);

export default userRouter;
