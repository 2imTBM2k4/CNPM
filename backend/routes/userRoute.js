import express from "express";
import {
  registerUser,
  loginUser,
  lockUser,
  getMe, // Thay getProfile bằng getMe nếu controller dùng getMe (dựa trên code gốc)
  updateUserAddress,
  listUsers,
  updateUserByAdmin,
  deleteUser,
  getStats,
  logoutUser, // Thêm nếu có
  updateProfile, // Thay nếu cần
} from "../controllers/userController.js"; // Đảm bảo controller có named exports

import { protect } from "../middleware/auth.js"; // Named import

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/lock", protect, lockUser);
userRouter.get("/me", protect, getMe); // Thay getProfile bằng getMe để khớp
userRouter.put("/update-address", protect, updateUserAddress);

// User CRUD for admin
userRouter.get("/list", protect, listUsers);
userRouter.post("/update", protect, updateUserByAdmin);
userRouter.post("/delete", protect, deleteUser);

// Mới: Stats route
userRouter.get("/stats", protect, getStats);

// Thêm nếu có từ code gốc
userRouter.post("/logout", logoutUser);
userRouter.put("/update", protect, updateProfile);

export default userRouter;
