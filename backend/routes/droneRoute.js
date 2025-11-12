import express from "express";
import { getDeliveryAddresses } from "../controllers/droneController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/addresses/:orderId", protect, getDeliveryAddresses);

export default router;

