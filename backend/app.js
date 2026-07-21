import express from "express";
import cors from "cors";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import restaurantRouter from "./routes/restaurantRoute.js";
import droneRouter from "./routes/droneRoute.js";
import configRouter from "./routes/configRoute.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/images", express.static("uploads"));

const cleanOrderPayload = (req, res, next) => {
  if (req.path === "/place" && req.body.restaurantId) {
    const { restaurantId } = req.body;
    if (
      typeof restaurantId === "object" &&
      restaurantId !== null &&
      restaurantId._id
    ) {
      req.body.restaurantId = restaurantId._id;
    }
  }
  next();
};

app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", cleanOrderPayload, orderRouter);
app.use("/api/restaurant", restaurantRouter);
app.use("/api/drone", droneRouter);
app.use("/api/config", configRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err.stack || err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Server error" });
});

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Cannot ${req.method} ${req.path}` });
});

export default app;
