import express from "express";
import { addFood, listFood, removeFood, updateFood } from "../controllers/foodController.js";
import multer from "multer";
import { default as authMiddleware, optionalAuth } from "../middleware/auth.js";  // Import cả 2
const foodRouter = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

foodRouter.post("/add", authMiddleware, upload.single("image"), addFood);
foodRouter.get("/list", optionalAuth, listFood);  // Thay bằng optionalAuth
foodRouter.post("/remove", authMiddleware, removeFood);
foodRouter.post("/update", authMiddleware, upload.single("image"), updateFood);

export default foodRouter;