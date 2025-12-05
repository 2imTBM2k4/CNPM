import express from "express";

const configRouter = express.Router();

// send paypal client id to frontend
configRouter.get("/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "test");
});

export default configRouter;
