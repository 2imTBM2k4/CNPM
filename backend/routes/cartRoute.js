import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import validate from "../middleware/validate.js";
import { cartItemSchema } from "../validations/cartValidation.js";

const router = express.Router();

router.use(protect);

router.get("/get", getCart);
router.post("/add", validate(cartItemSchema), addToCart);
router.post("/remove", validate(cartItemSchema), removeFromCart);
router.post("/clear", clearCart);

export default router;
