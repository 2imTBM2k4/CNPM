import jwt from "jsonwebtoken";
import userModel from "../models/userModel.cjs";

const authMiddleware = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.token) {
    token = req.headers.token;
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized. Login Again" });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // FIX: Phải select 'role' explicitly vì nó có thể bị exclude mặc định
    const user = await userModel
      .findById(token_decode.id)
      .select("name email role restaurantId phone address locked") // Thêm role vào select
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    console.log("Auth middleware - User loaded:", {
      id: user._id,
      email: user.email,
      role: user.role, // Debug log
    });

    // Đảm bảo restaurantId là string
    if (user.restaurantId) {
      user.restaurantId = user.restaurantId.toString();
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Auth error:", error.message);
    res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

// Optional auth tương tự
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.token) {
    token = req.headers.token;
  }

  if (token) {
    try {
      const token_decode = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel
        .findById(token_decode.id)
        .select("name email role restaurantId phone address"); // Thêm role

      if (user) {
        if (user.restaurantId && typeof user.restaurantId === "object") {
          user.restaurantId = user.restaurantId.toString();
        }
        req.user = user;
      }
    } catch (error) {
      console.log("Optional auth error:", error);
    }
  }
  next();
};

export { authMiddleware as default, optionalAuth };
