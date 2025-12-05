import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import restaurantRouter from "./routes/restaurantRoute.js";
import droneRouter from "./routes/droneRoute.js";
import configRouter from "./routes/configRoute.js";
import { Server } from "socket.io";
import http from "http";
import { v2 as cloudinary } from "cloudinary"; // Giữ Cloudinary
dotenv.config();

// Config Cloudinary (giữ nguyên)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// Socket logic
io.on("connection", (socket) => {
  // SỬA LỖI: Thêm kiểm tra để ngăn server crash khi restaurantId không hợp lệ
  socket.on("joinRestaurant", (restaurantId) => {
    if (restaurantId) {
      socket.join(`restaurant_${restaurantId}`);
    } else {
      console.warn("Socket tried to join a room with an invalid restaurantId.");
    }
  });
});

const PORT = process.env.PORT || 4000;

// THÊM: Import uploadMiddleware từ config (thay vì định nghĩa local)
import { uploadMiddleware } from "./config/multer.js";

// Middleware (trước routes)
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// THÊM: Middleware để gắn `io` vào mỗi request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// THÊM: Serve static files từ uploads/ với prefix /images (để load ảnh)
app.use("/images", express.static("uploads"));

// Connect Database
connectDB();

// Middleware để làm sạch restaurantId trong payload của order
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

// Mount routes
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter); // Giữ nguyên
app.use("/api/order", cleanOrderPayload, orderRouter); // Thêm middleware
app.use("/api/restaurant", restaurantRouter);
app.use("/api/drone", droneRouter);
app.use("/api/config", configRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack || err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Server error" });
});

// 404 handler
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Cannot ${req.method} ${req.path}` });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    routes: { food: !!foodRouter, user: !!userRouter },
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
  });
});

// Test save (giữ nguyên)
app.post("/api/test-save", async (req, res) => {
  try {
    const Food = (await import("./models/foodModel.cjs")).default;
    const newFood = new Food({
      name: "Test Food",
      description: "Test desc",
      price: 10,
      image: "test.png",
      category: "test",
      restaurantId: "someId",
    });
    await newFood.save();
    res.status(201).json({ message: "Saved successfully", data: newFood });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
