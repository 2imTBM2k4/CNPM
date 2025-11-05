import express from "express";
import {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  getStatusStats, // Thêm function mới
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js"; // Sửa: named { protect }

const router = express.Router();

router.post("/place", protect, placeOrder); // Thay auth bằng protect
router.post("/verify", verifyOrder); // Không cần protect nếu public
router.get("/userorders", protect, userOrders);
router.get("/list", protect, listOrders);
// THÊM HOẶC SỬA ROUTE UPDATE STATUS
router.post("/status", protect, updateStatus);
// THÊM ROUTE MỚI CHO STATS
router.get("/status-stats", protect, getStatusStats);

export default router;
