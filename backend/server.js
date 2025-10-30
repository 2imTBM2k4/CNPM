// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import foodRouter from './routes/foodRoute.js';
// import userRouter from './routes/userRoute.js';
// import cartRouter from './routes/cartRoute.js';
// import orderRouter from './routes/orderRoute.js';
// import restaurantRouter from './routes/restaurantRoute.js';
// import { Server } from 'socket.io';
// import http from 'http';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// dotenv.config();

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", 
//     methods: ["GET", "POST"]
//   }
// });

// app.set('io', io);

// // Socket logic (giữ nguyên)
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);
//   socket.on('joinRestaurant', (restaurantId) => {
//     socket.join(`restaurant_${restaurantId}`);
//     console.log(`Joined room: restaurant_${restaurantId}`);
//   });
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });

// const PORT = process.env.PORT || 4000;

// // Multer config (di chuyển sau middleware, trước routes để không interfere JSON)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let uploadPath = 'uploads/foods';
//     if (req.originalUrl.includes('/restaurant')) {
//       uploadPath = 'uploads/restaurants';
//     }
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const uploadMiddleware = multer({ storage });

// // Middleware (trước routes)
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));  // Tăng limit cho form-data
// app.use('/images', express.static('uploads'));

// // Connect Database
// connectDB();

// // Mount routes (thêm log debug)
// app.use('/api/food', foodRouter);
// app.use('/api/user', userRouter);
// app.use('/api/cart', cartRouter);
// app.use('/api/order', orderRouter);
// app.use('/api/restaurant', restaurantRouter);

// // Log mounted (debug)
// console.log('Routes mounted:', {
//   food: !!foodRouter,
//   user: !!userRouter,
//   cart: !!cartRouter,
//   order: !!orderRouter,
//   restaurant: !!restaurantRouter
// });

// // Global multer (sau routes, chỉ cho unmatched nếu cần - nhưng tốt hơn dùng per-route)
// app.use(uploadMiddleware.any());  // Fallback, nhưng routes sẽ override

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('Global error:', err.stack || err);
//   res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
// });

// // 404 handler (sau routes)
// app.use((req, res) => {
//   console.log('404 unmatched:', req.method, req.path, 'Body:', req.body ? 'has body' : 'no body');  // Debug body
//   res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` });
// });

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok', routes: { food: !!foodRouter, user: !!userRouter } });
// });

// // Test save (giữ nguyên)
// app.post('/api/test-save', async (req, res) => {
//   try {
//     const Food = (await import('./models/foodModel.cjs')).default;
//     const newFood = new Food({
//       name: 'Test Food',
//       description: 'Test desc',
//       price: 10,
//       image: 'test.png',
//       category: 'test',
//       restaurantId: 'someId'
//     });
//     await newFood.save();
//     res.status(201).json({ message: 'Saved successfully', data: newFood });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import foodRouter from './routes/foodRoute.js';
// import userRouter from './routes/userRoute.js';
// import cartRouter from './routes/cartRoute.js';
// import orderRouter from './routes/orderRoute.js';
// import restaurantRouter from './routes/restaurantRoute.js';
// import { Server } from 'socket.io';
// import http from 'http';
// import { v2 as cloudinary } from 'cloudinary';  // Giữ Cloudinary

// dotenv.config();

// // Config Cloudinary (giữ nguyên)
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", 
//     methods: ["GET", "POST"]
//   }
// });

// app.set('io', io);

// // Socket logic (giữ nguyên)
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);
//   socket.on('joinRestaurant', (restaurantId) => {
//     socket.join(`restaurant_${restaurantId}`);
//     console.log(`Joined room: restaurant_${restaurantId}`);
//   });
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });

// const PORT = process.env.PORT || 4000;

// // THÊM: Import uploadMiddleware từ config (thay vì định nghĩa local)
// import { uploadMiddleware } from './config/multer.js';

// // Middleware (trước routes)
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));

// // THÊM: Serve static files từ uploads/ với prefix /images (để load ảnh)
// app.use('/images', express.static('uploads'));

// // Connect Database
// connectDB();

// // Mount routes
// app.use('/api/food', foodRouter);
// app.use('/api/user', userRouter);
// app.use('/api/cart', cartRouter);
// app.use('/api/order', orderRouter);
// app.use('/api/restaurant', restaurantRouter);

// // Log mounted (debug)
// console.log('Routes mounted:', {
//   food: !!foodRouter,
//   user: !!userRouter,
//   cart: !!cartRouter,
//   order: !!orderRouter,
//   restaurant: !!restaurantRouter
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('Global error:', err.stack || err);
//   res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
// });

// // 404 handler
// app.use((req, res) => {
//   console.log('404 unmatched:', req.method, req.path, 'Body:', req.body ? 'has body' : 'no body');
//   res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` });
// });

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok', routes: { food: !!foodRouter, user: !!userRouter }, cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME });
// });

// // Test save (giữ nguyên)
// app.post('/api/test-save', async (req, res) => {
//   try {
//     const Food = (await import('./models/foodModel.cjs')).default;
//     const newFood = new Food({
//       name: 'Test Food',
//       description: 'Test desc',
//       price: 10,
//       image: 'test.png',
//       category: 'test',
//       restaurantId: 'someId'
//     });
//     await newFood.save();
//     res.status(201).json({ message: 'Saved successfully', data: newFood });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log('Cloudinary configured:', !!cloudinary.config().cloud_name);
// });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import restaurantRouter from './routes/restaurantRoute.js';
import { Server } from 'socket.io';
import http from 'http';
import { v2 as cloudinary } from 'cloudinary';  // Giữ Cloudinary

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
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

// Socket logic (giữ nguyên)
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('joinRestaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`Joined room: restaurant_${restaurantId}`);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000;

// THÊM: Import uploadMiddleware từ config (thay vì định nghĩa local)
import { uploadMiddleware } from './config/multer.js';

// Middleware (trước routes)
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// THÊM: Serve static files từ uploads/ với prefix /images (để load ảnh)
app.use('/images', express.static('uploads'));

// Connect Database
connectDB();

// Mount routes
app.use('/api/food', foodRouter);
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/restaurant', restaurantRouter);

// Log mounted (debug)
console.log('Routes mounted:', {
  food: !!foodRouter,
  user: !!userRouter,
  cart: !!cartRouter,
  order: !!orderRouter,
  restaurant: !!restaurantRouter
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack || err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

// 404 handler
app.use((req, res) => {
  console.log('404 unmatched:', req.method, req.path, 'Body:', req.body ? 'has body' : 'no body');
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', routes: { food: !!foodRouter, user: !!userRouter }, cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME });
});

// Test save (giữ nguyên)
app.post('/api/test-save', async (req, res) => {
  try {
    const Food = (await import('./models/foodModel.cjs')).default;
    const newFood = new Food({
      name: 'Test Food',
      description: 'Test desc',
      price: 10,
      image: 'test.png',
      category: 'test',
      restaurantId: 'someId'
    });
    await newFood.save();
    res.status(201).json({ message: 'Saved successfully', data: newFood });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Cloudinary configured:', !!cloudinary.config().cloud_name);
});