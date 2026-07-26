import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { Server } from "socket.io";
import http from "http";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = http.createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  socket.on("joinRestaurant", (restaurantId) => {
    if (restaurantId) {
      socket.join(`restaurant_${restaurantId}`);
    } else {
      console.warn("Socket tried to join a room with an invalid restaurantId.");
    }
  });
});

const PORT = process.env.PORT || 4000;

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
