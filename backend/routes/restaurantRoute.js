import express from "express";
import { default as authMiddleware, optionalAuth } from "../middleware/auth.js";
import {
  listRestaurants,
  updateRestaurant,
  createRestaurant,
  deleteRestaurant,
} from "../controllers/restaurantController.js";
import { uploadMiddleware } from "../config/multer.js"; // SỬA: ../config

const restaurantRouter = express.Router();

// Log all routes for debug
restaurantRouter.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Hit restaurant route`);
  next();
});

restaurantRouter.get("/list", optionalAuth, listRestaurants);

restaurantRouter.put(
  "/:id",
  authMiddleware,
  uploadMiddleware.single("image"),
  updateRestaurant
);

restaurantRouter.post(
  "/",
  authMiddleware,
  uploadMiddleware.single("image"),
  createRestaurant
);

restaurantRouter.delete("/", authMiddleware, deleteRestaurant);

export default restaurantRouter;
