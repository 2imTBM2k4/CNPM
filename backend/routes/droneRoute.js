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
import validate from "../middleware/validate.js";
import {
  createDroneSchema,
  updateDroneSchema,
  assignDroneSchema,
  scanQRSchema,
  confirmDeliverySchema,
  cargoWeightSchema,
  historyQuerySchema,
} from "../validations/droneValidation.js";

const router = express.Router();

router.get("/addresses/:orderId", protect, getDeliveryAddresses);
router.post("/assign", protect, validate(assignDroneSchema), assignDrone);
router.post("/scan-qr", protect, validate(scanQRSchema), scanQR);
router.post("/confirm-delivery", protect, validate(confirmDeliverySchema), confirmDelivery);
router.post("/cargo-weight", protect, validate(cargoWeightSchema), updateCargoWeight);

router.get("/history/all", protect, validate(historyQuerySchema, "query"), getAllDeliveryHistory);
router.get("/history/:id", protect, getDroneDeliveryHistory);

router.get("/", protect, getAllDrones);
router.get("/:id", protect, getDroneById);
router.post("/create", protect, validate(createDroneSchema), createDrone);
router.put("/:id", protect, validate(updateDroneSchema), updateDrone);
router.delete("/:id", protect, deleteDrone);

export default router;
