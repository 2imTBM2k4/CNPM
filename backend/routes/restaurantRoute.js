import express from "express";
import {
  listRestaurants,
  updateRestaurant,
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  lockRestaurant,
} from "../controllers/restaurantController.js"; // Giả định named exports từ controller
import { protect, optionalAuth } from "../middleware/auth.js"; // Sửa: named imports
import { uploadMiddleware } from "../config/multer.js";

const restaurantRouter = express.Router();

// Log all routes for debug
restaurantRouter.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Hit restaurant route`);
  next();
});

restaurantRouter.get("/list", optionalAuth, listRestaurants);

restaurantRouter.put(
  "/:id",
  protect,
  uploadMiddleware.single("image"),
  updateRestaurant
);

restaurantRouter.post(
  "/",
  protect,
  uploadMiddleware.single("image"),
  createRestaurant
);

restaurantRouter.delete("/", protect, deleteRestaurant);

restaurantRouter.get("/:id", protect, getRestaurantById); // Mới: Get single
restaurantRouter.put("/:id/lock", protect, lockRestaurant); // Mới: Lock/unlock

export default restaurantRouter;
