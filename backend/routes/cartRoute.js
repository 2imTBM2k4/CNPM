// backend/routes/cartRoute.js
import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.use(protect); // tất cả route cần login

router.get("/get", getCart);
router.post("/add", addToCart);
router.post("/remove", removeFromCart);
router.post("/clear", clearCart);

export default router;
