import express from "express";
import {
  addFood,
  listFood,
  removeFood,
  updateFood,
  getFoodById, // Đã import từ controller
} from "../controllers/foodController.js";
import { uploadMiddleware } from "../config/multer.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const foodRouter = express.Router();

foodRouter.post("/add", protect, uploadMiddleware.single("image"), addFood);

// SỬA: ĐẶT /list TRƯỚC /:id ĐỂ TRÁNH CONFLICT
foodRouter.get("/list", optionalAuth, listFood);

// GET single food by ID (public, no auth)
foodRouter.get("/:id", getFoodById);

foodRouter.post("/remove", protect, removeFood);
foodRouter.post(
  "/update",
  protect,
  uploadMiddleware.single("image"),
  updateFood
);

export default foodRouter;
