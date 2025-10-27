import express from "express";
import authMiddleware from "../middleware/auth.js";
import { listRestaurants, updateRestaurant } from "../controllers/restaurantController.js";  // Loại create/delete

const restaurantRouter = express.Router();

restaurantRouter.get("/list", authMiddleware, listRestaurants);
restaurantRouter.post("/update", authMiddleware, updateRestaurant);

export default restaurantRouter;