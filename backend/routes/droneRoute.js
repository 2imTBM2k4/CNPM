import express from "express";
import {
  getDeliveryAddresses,
  assignDrone,
  scanQR,
  confirmDelivery,
  getAllDrones,
  createDrone,
  updateDrone,
  deleteDrone,
  getDroneById,
  updateCargoWeight,
  getDroneDeliveryHistory,
  getAllDeliveryHistory,
} from "../controllers/droneController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Drone delivery routes
router.get("/addresses/:orderId", protect, getDeliveryAddresses);
router.post("/assign", protect, assignDrone);
router.post("/scan-qr", protect, scanQR);
router.post("/confirm-delivery", protect, confirmDelivery);
router.post("/cargo-weight", protect, updateCargoWeight);

// Delivery history routes (Admin)
router.get("/history/all", protect, getAllDeliveryHistory);
router.get("/history/:id", protect, getDroneDeliveryHistory);

// Drone management routes (Admin)
router.get("/", protect, getAllDrones);
router.get("/:id", protect, getDroneById);
router.post("/create", protect, createDrone);
router.put("/:id", protect, updateDrone);
router.delete("/:id", protect, deleteDrone);

export default router;

