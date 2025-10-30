// import express from "express";
// import { loginUser, registerUser, lockUser, getMe } from "../controllers/userController.js";  // Thêm getMe
// import authMiddleware from "../middleware/auth.js";

// const userRouter = express.Router();

// userRouter.post("/register", registerUser);
// userRouter.post("/login", loginUser);
// userRouter.post("/lock", authMiddleware, lockUser);
// userRouter.get("/me", authMiddleware, getMe);  // Mới: Protected route

// export default userRouter;

import express from "express";
import { loginUser, registerUser, lockUser, getMe, updateUserAddress } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/lock", authMiddleware, lockUser);
userRouter.get("/me", authMiddleware, getMe);
userRouter.put("/update-address", authMiddleware, updateUserAddress); // MỚI: Protected PUT route

export default userRouter;