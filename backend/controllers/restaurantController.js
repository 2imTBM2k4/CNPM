// import Restaurant from "../models/restaurantModel.cjs";
// import restaurantModel from "../models/restaurantModel.cjs";
// import userModel from "../models/userModel.cjs";


// // Create restaurant (admin only)
// const createRestaurant = async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.json({ success: false, message: "Only admins can create restaurants" });
//     }
//     const { name, address, phone, description, ownerEmail } = req.body;

//     // Tạo user owner nếu cần (assume register owner riêng, hoặc tạo ở đây)
//     const owner = await userModel.findOne({ email: ownerEmail });
//     if (!owner) {
//       return res.json({ success: false, message: "Owner user not found" });
//     }
//     if (owner.role !== 'restaurant_owner') {
//       return res.json({ success: false, message: "User must be restaurant_owner" });
//     }

//     const newRestaurant = new restaurantModel({
//       name,
//       address,
//       phone,
//       description,
//       owner: owner._id
//     });
//     await newRestaurant.save();

//     // Update user với restaurantId
//     await userModel.findByIdAndUpdate(owner._id, { restaurantId: newRestaurant._id });

//     res.json({ success: true, message: "Restaurant created", restaurant: newRestaurant });
//   } catch (error) {
//     console.error(error);
//     res.json({ success: false, message: "Error" });
//   }
// };

// // List restaurants (admin only)
// const listRestaurants = async (req, res) => {
//   try {
//     const restaurants = await Restaurant.find({});
//     res.json({ success: true, data: restaurants });
//   } catch (error) {
//     console.error("Error listing restaurants:", error);
//     res.json({ success: false, message: "Error listing restaurants" });
//   }
// };
// // Update restaurant (admin only)
// const updateRestaurant = async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.json({ success: false, message: "Unauthorized" });
//     }
//     const { id, name, address, phone, description } = req.body;
//     const updated = await restaurantModel.findByIdAndUpdate(id, { name, address, phone, description }, { new: true });
//     if (!updated) {
//       return res.json({ success: false, message: "Restaurant not found" });
//     }
//     res.json({ success: true, message: "Updated", restaurant: updated });
//   } catch (error) {
//     console.error(error);
//     res.json({ success: false, message: "Error" });
//   }
// };

// // Delete restaurant (admin only)
// const deleteRestaurant = async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.json({ success: false, message: "Unauthorized" });
//     }
//     const { id } = req.body;
//     await restaurantModel.findByIdAndDelete(id);
//     // Optional: Xóa food/order liên quan, hoặc set null
//     res.json({ success: true, message: "Deleted" });
//   } catch (error) {
//     console.error(error);
//     res.json({ success: false, message: "Error" });
//   }
// };

// export { createRestaurant, listRestaurants, updateRestaurant, deleteRestaurant };

import Restaurant from "../models/restaurantModel.cjs";
import User from "../models/userModel.cjs";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer config (giữ nguyên)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/restaurants';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// List (giữ nguyên, thêm log)
const listRestaurants = async (req, res) => {
  try {
    console.log('GET /list hit');  // Debug
    const restaurants = await Restaurant.find({}).populate('owner', 'name email');
    res.json({ success: true, data: restaurants });
  } catch (error) {
    console.error("Error listing restaurants:", error);
    res.status(500).json({ success: false, message: "Error listing restaurants" });  // Status 500
  }
};

// Update (thêm log, check existence, JSON error)
// Update restaurant (admin hoặc owner của restaurant đó)
const updateRestaurant = async (req, res) => {
  console.log('updateRestaurant controller hit, ID:', req.params.id, 'File:', req.file ? req.file.filename : 'no file');
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate('owner', 'name email');

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    // Fix: Check quyền đúng - so sánh req.user._id với restaurant.owner._id (user ID vs owner ID)
    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?._id.toString() === restaurant.owner._id.toString();  // Sửa: Dùng user._id, không phải restaurantId
    console.log('Auth check debug:', {  // Giữ log để verify
      userId: req.user._id,
      userRole: req.user.role,
      userRestaurantId: req.user.restaurantId,  // Chỉ để debug, không dùng check
      restaurantOwnerId: restaurant.owner._id.toString(),
      isAdmin,
      isOwner
    });

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Unauthorized: Only admin or owner can update" });
    }

    // Update fields
    const { name, address, email, phone, description } = req.body;
    const updateData = { name, address, email, phone, description };
    if (req.file) {
      updateData.image = `/images/restaurants/${req.file.filename}`;
    }

    const updated = await Restaurant.findByIdAndUpdate(id, updateData, { new: true }).populate('owner', 'name email');
    res.json({ success: true, message: "Updated successfully", restaurant: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating restaurant" });
  }
};
// Create (thêm email, log)
const createRestaurant = async (req, res) => {
  try {
    console.log('POST / create hit');  // Debug
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Only admins can create restaurants" });
    }
    const { name, address, phone, description, email, ownerEmail } = req.body;

    const owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner user not found" });
    }
    if (owner.role !== 'restaurant_owner') {
      return res.status(403).json({ success: false, message: "User must be restaurant_owner" });
    }

    const newRestaurant = new Restaurant({
      name,
      address,
      email,  // Required
      phone,
      description,
      owner: owner._id
    });
    await newRestaurant.save();

    await User.findByIdAndUpdate(owner._id, { restaurantId: newRestaurant._id });

    res.status(201).json({ success: true, message: "Restaurant created", restaurant: newRestaurant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating restaurant" });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    console.log('DELETE hit');  // Debug
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.body;
    const deleted = await Restaurant.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting" });
  }
};

export { createRestaurant, listRestaurants, updateRestaurant, deleteRestaurant, upload };