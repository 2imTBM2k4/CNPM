import express from "express";
import {
  loginUser,
  registerUser,
  lockUser,
  getMe,
  updateUserAddress,
  listUsers,
  updateUserByAdmin,
  deleteUser,
  getStats,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/lock", authMiddleware, lockUser);
userRouter.get("/me", authMiddleware, getMe);
userRouter.put("/update-address", authMiddleware, updateUserAddress);

// User CRUD for admin
userRouter.get("/list", authMiddleware, listUsers);
userRouter.post("/update", authMiddleware, updateUserByAdmin);
userRouter.post("/delete", authMiddleware, deleteUser);

// Mới: Stats route
userRouter.get("/stats", authMiddleware, getStats);

export default userRouter;
