// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import foodRouter from './routes/foodRoute.js';
// import userRouter from './routes/userRoute.js';
// import cartRouter from './routes/cartRoute.js';
// import orderRouter from './routes/orderRoute.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 4000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use('/images', express.static('uploads'));

// // Connect Database
// connectDB();
// app.post('/api/test-save', async (req, res) => {
//   try {
//     const Food = (await import('./models/foodModel.cjs')).default;
//     const newFood = new Food({
//       name: 'Test Food',
//       description: 'Test desc',
//       price: 10,
//       image: 'test.png',
//       category: 'test'
//     });
//     await newFood.save();
//     res.status(201).json({ message: 'Saved successfully', data: newFood });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
// // API endpoints
// app.use('/api/food', foodRouter);
// app.use('/api/user', userRouter);
// app.use('/api/cart', cartRouter);
// app.use('/api/order', orderRouter);

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
//   });
// });

// // Default route
// app.get('/', (req, res) => {
//   res.send('API Working');
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
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
import restaurantRouter from './routes/restaurantRoute.js';  // Mới
import { Server } from 'socket.io';  // Mới
import http from 'http';  // Mới

dotenv.config();

const app = express();
const server = http.createServer(app);  // Mới: Để socket
const io = new Server(server, {
  cors: {
    origin: "*",  // Adjust cho frontend
    methods: ["GET", "POST"]
  }
});

app.set('io', io);  // Mới: Attach io vào app để controllers dùng

// Socket logic: Restaurant join room dựa trên restaurantId
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

// Middleware
app.use(cors());
app.use(express.json());
app.use('/images', express.static('uploads'));

// Connect Database
connectDB();

// API endpoints
app.use('/api/food', foodRouter);
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/restaurant', restaurantRouter);  // Mới

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test save (giữ nguyên nếu cần)
app.post('/api/test-save', async (req, res) => {
  try {
    const Food = (await import('./models/foodModel.cjs')).default;
    const newFood = new Food({
      name: 'Test Food',
      description: 'Test desc',
      price: 10,
      image: 'test.png',
      category: 'test',
      restaurantId: 'someId'  // Test
    });
    await newFood.save();
    res.status(201).json({ message: 'Saved successfully', data: newFood });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});