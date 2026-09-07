import express from "express";
import { getDeliveryRates } from "../config/fees.js";

const configRouter = express.Router();

// send paypal client id to frontend
configRouter.get("/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "test");
});

// Fees the checkout UI displays. The server still recomputes the total from
// these itself — this endpoint only keeps the displayed figures honest.
configRouter.get("/fees", (req, res) => {
  res.json({
    success: true,
    ...getDeliveryRates(),
  });
});

export default configRouter;
