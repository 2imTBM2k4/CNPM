import express from "express";
import {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  getStatusStats,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  placeOrderSchema,
  updateStatusSchema,
  verifyOrderSchema,
} from "../validations/orderValidation.js";

const router = express.Router();

router.post("/place", protect, validate(placeOrderSchema), placeOrder);
router.post("/verify", protect, validate(verifyOrderSchema), verifyOrder);
router.get("/userorders", protect, userOrders);
router.get("/list", protect, listOrders);
router.post("/status", protect, validate(updateStatusSchema), updateStatus);
router.get("/status-stats", protect, authorize("admin"), getStatusStats);

export default router;
