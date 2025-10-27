// import jwt from "jsonwebtoken";
// import userModel from "../models/userModel.cjs";

// const authMiddleware = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.headers.token) {
//     token = req.headers.token;
//   }

//   if (!token) {
//     return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
//   }

//   try {
//     const token_decode = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await userModel.findById(token_decode.id).populate('restaurantId');
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }
//     req.user = user;
//     next();
//   } catch (error) {
//     console.log(error);
//     res.status(401).json({ success: false, message: "Invalid Token" });
//   }
// };

// // Mới: Optional auth - Set req.user nếu có token, nhưng không fail nếu không có
// const optionalAuth = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.headers.token) {
//     token = req.headers.token;
//   }

//   if (token) {
//     try {
//       const token_decode = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await userModel.findById(token_decode.id).populate('restaurantId');
//       if (user) {
//         req.user = user;
//       }
//     } catch (error) {
//       console.log('Optional auth error:', error);  // Log nhưng không fail
//     }
//   }
//   next();  // Luôn proceed
// };

// export { authMiddleware as default, optionalAuth };
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
    // Fix: Không populate full, chỉ select fields cần + restaurantId as string
    const user = await userModel.findById(token_decode.id).select('name email role restaurantId');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // Convert restaurantId to string nếu là ObjectId
    if (user.restaurantId && typeof user.restaurantId === 'object') {
      user.restaurantId = user.restaurantId.toString();
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
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