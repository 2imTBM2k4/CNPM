// import express from "express";
// import { default as authMiddleware, optionalAuth } from "../middleware/auth.js";
// import { listRestaurants, updateRestaurant, createRestaurant, deleteRestaurant, upload as uploadMiddleware } from "../controllers/restaurantController.js";  // Thêm createRestaurant, deleteRestaurant

// const restaurantRouter = express.Router();

// // Log all routes for debug (optional, giữ để test)
// restaurantRouter.use((req, res, next) => {
//   console.log(`${req.method} ${req.path} - Hit restaurant route`);
//   next();
// });

// restaurantRouter.get("/list", optionalAuth, listRestaurants);

// restaurantRouter.put("/:id", authMiddleware, (req, res, next) => {
//   console.log('PUT /:id middleware hit, ID:', req.params.id);  // Debug
//   uploadMiddleware.single('image')(req, res, (err) => {
//     if (err) {
//       console.error('Multer error:', err);
//       return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
//     }
//     next();
//   });
// }, updateRestaurant);  // Wrap upload to handle optional file

// // POST / create (admin only, no upload image ở đây - nếu cần upload, đổi single('image'))
// restaurantRouter.post("/", authMiddleware, (req, res, next) => uploadMiddleware.none()(req, res, next), createRestaurant);  // Wrap none() cho no file

// // DELETE / (admin only, body {id})
// restaurantRouter.delete("/", authMiddleware, deleteRestaurant);

// export default restaurantRouter;

import express from "express";
import { default as authMiddleware, optionalAuth } from "../middleware/auth.js";
import { listRestaurants, updateRestaurant, createRestaurant, deleteRestaurant } from "../controllers/restaurantController.js";
import { uploadMiddleware } from '../config/multer.js';  // SỬA: ../config

const restaurantRouter = express.Router();

// Log all routes for debug
restaurantRouter.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Hit restaurant route`);
  next();
});

restaurantRouter.get("/list", optionalAuth, listRestaurants);

restaurantRouter.put("/:id", authMiddleware, uploadMiddleware.single('image'), updateRestaurant);

restaurantRouter.post("/", authMiddleware, uploadMiddleware.single('image'), createRestaurant);

restaurantRouter.delete("/", authMiddleware, deleteRestaurant);

export default restaurantRouter;