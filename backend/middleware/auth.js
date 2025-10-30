import jwt from "jsonwebtoken";
import userModel from "../models/userModel.cjs";

const authMiddleware = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.token) {
    token = req.headers.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
  }
  try {
  const token_decode = jwt.verify(token, process.env.JWT_SECRET);
  // Fix: Populate restaurant đầy đủ nếu cần (nhưng select để lean)
  const user = await userModel.findById(token_decode.id).select('name email role restaurantId').lean();  // .lean() cho perf
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  // Đảm bảo restaurantId là string
  if (user.restaurantId) {
    user.restaurantId = user.restaurantId.toString();
  } else {
    console.log('Warning: User has no restaurantId:', user._id);  // Debug nếu null
  }
  req.user = user;
  next();
} catch (error) {
  console.log('Auth error:', error.message);
  res.status(401).json({ success: false, message: "Invalid Token" });
}
};

// Optional auth tương tự
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.token) {
    token = req.headers.token;
  }

  if (token) {
    try {
      const token_decode = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(token_decode.id).select('name email role restaurantId');
      if (user) {
        // Fix: Convert to string
        if (user.restaurantId && typeof user.restaurantId === 'object') {
          user.restaurantId = user.restaurantId.toString();
        }
        req.user = user;
      }
    } catch (error) {
      console.log('Optional auth error:', error);
    }
  }
  next();
};

export { authMiddleware as default, optionalAuth };