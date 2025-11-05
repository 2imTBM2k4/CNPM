import express from "express";
import {
  addFood,
  listFood,
  removeFood,
  updateFood,
} from "../controllers/foodController.js";
import { uploadMiddleware } from "../config/multer.js"; // Giả định config/multer.js đã OK
import { protect, optionalAuth } from "../middleware/auth.js"; // Sửa: import named exports

const foodRouter = express.Router();

foodRouter.post("/add", protect, uploadMiddleware.single("image"), addFood); // Thay authMiddleware bằng protect
foodRouter.get("/list", optionalAuth, listFood);
foodRouter.post("/remove", protect, removeFood);
foodRouter.post(
  "/update",
  protect,
  uploadMiddleware.single("image"),
  updateFood
);

export default foodRouter;
