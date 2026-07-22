import express from "express";
import {
  listRestaurants,
  updateRestaurant,
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  lockRestaurant,
} from "../controllers/restaurantController.js";
import { protect, optionalAuth } from "../middleware/auth.js";
import { uploadMiddleware } from "../config/multer.js";
import validate from "../middleware/validate.js";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  deleteRestaurantSchema,
  lockRestaurantSchema,
} from "../validations/restaurantValidation.js";

const restaurantRouter = express.Router();

restaurantRouter.get("/list", optionalAuth, listRestaurants);

restaurantRouter.put(
  "/:id",
  protect,
  uploadMiddleware.single("image"),
  validate(updateRestaurantSchema),
  updateRestaurant
);

restaurantRouter.post(
  "/",
  protect,
  uploadMiddleware.single("image"),
  validate(createRestaurantSchema),
  createRestaurant
);

restaurantRouter.delete("/", protect, validate(deleteRestaurantSchema), deleteRestaurant);

restaurantRouter.get("/:id", protect, getRestaurantById);

restaurantRouter.put("/:id/lock", protect, validate(lockRestaurantSchema), lockRestaurant);

export default restaurantRouter;
