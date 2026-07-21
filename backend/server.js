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
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
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
