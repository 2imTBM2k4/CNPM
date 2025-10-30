// import Restaurant from "../models/restaurantModel.cjs";
// import User from "../models/userModel.cjs";
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// // Multer config (giữ nguyên)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = 'uploads/restaurants';
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // List (giữ nguyên, thêm log)
// const listRestaurants = async (req, res) => {
//   try {
//     console.log('GET /list hit');  // Debug
//     const restaurants = await Restaurant.find({}).populate('owner', 'name email');
//     res.json({ success: true, data: restaurants });
//   } catch (error) {
//     console.error("Error listing restaurants:", error);
//     res.status(500).json({ success: false, message: "Error listing restaurants" });  // Status 500
//   }
// };

// // Update (thêm log, check existence, JSON error)
// // Update restaurant (admin hoặc owner của restaurant đó)
// const updateRestaurant = async (req, res) => {
//   console.log('updateRestaurant controller hit, ID:', req.params.id, 'File:', req.file ? req.file.filename : 'no file');
//   try {
//     const { id } = req.params;
//     const restaurant = await Restaurant.findById(id).populate('owner', 'name email');

//     if (!restaurant) {
//       return res.status(404).json({ success: false, message: "Restaurant not found" });
//     }

//     // Fix: Check quyền đúng - so sánh req.user._id với restaurant.owner._id (user ID vs owner ID)
//     const isAdmin = req.user?.role === 'admin';
//     const isOwner = req.user?._id.toString() === restaurant.owner._id.toString();  // Sửa: Dùng user._id, không phải restaurantId
//     console.log('Auth check debug:', {  // Giữ log để verify
//       userId: req.user._id,
//       userRole: req.user.role,
//       userRestaurantId: req.user.restaurantId,  // Chỉ để debug, không dùng check
//       restaurantOwnerId: restaurant.owner._id.toString(),
//       isAdmin,
//       isOwner
//     });

//     if (!isAdmin && !isOwner) {
//       return res.status(403).json({ success: false, message: "Unauthorized: Only admin or owner can update" });
//     }

//     // Update fields
//     const { name, address, email, phone, description } = req.body;
//     const updateData = { name, address, email, phone, description };
//     if (req.file) {
//       updateData.image = `/images/restaurants/${req.file.filename}`;
//     }

//     const updated = await Restaurant.findByIdAndUpdate(id, updateData, { new: true }).populate('owner', 'name email');
//     res.json({ success: true, message: "Updated successfully", restaurant: updated });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Error updating restaurant" });
//   }
// };
// // Create (thêm email, log)
// const createRestaurant = async (req, res) => {
//   try {
//     console.log('POST / create hit');  // Debug
//     if (req.user?.role !== 'admin') {
//       return res.status(403).json({ success: false, message: "Only admins can create restaurants" });
//     }
//     const { name, address, phone, description, email, ownerEmail } = req.body;

//     const owner = await User.findOne({ email: ownerEmail });
//     if (!owner) {
//       return res.status(404).json({ success: false, message: "Owner user not found" });
//     }
//     if (owner.role !== 'restaurant_owner') {
//       return res.status(403).json({ success: false, message: "User must be restaurant_owner" });
//     }

//     const newRestaurant = new Restaurant({
//       name,
//       address,
//       email,  // Required
//       phone,
//       description,
//       owner: owner._id
//     });
//     await newRestaurant.save();

//     await User.findByIdAndUpdate(owner._id, { restaurantId: newRestaurant._id });

//     res.status(201).json({ success: true, message: "Restaurant created", restaurant: newRestaurant });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Error creating restaurant" });
//   }
// };

// const deleteRestaurant = async (req, res) => {
//   try {
//     console.log('DELETE hit');  // Debug
//     if (req.user?.role !== 'admin') {
//       return res.status(403).json({ success: false, message: "Unauthorized" });
//     }
//     const { id } = req.body;
//     const deleted = await Restaurant.findByIdAndDelete(id);
//     if (!deleted) {
//       return res.status(404).json({ success: false, message: "Restaurant not found" });
//     }
//     res.json({ success: true, message: "Deleted" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Error deleting" });
//   }
// };

// export { createRestaurant, listRestaurants, updateRestaurant, deleteRestaurant, upload };

import Restaurant from "../models/restaurantModel.cjs";
import User from "../models/userModel.cjs";
import { v2 as cloudinary } from 'cloudinary';  // Thêm
import fs from 'fs';  // Thêm

// Xóa: Multer config (routes sẽ dùng uploadMiddleware từ server.js)

// List (không thay đổi)
const listRestaurants = async (req, res) => {
  try {
    console.log('GET /list hit');
    const restaurants = await Restaurant.find({}).populate('owner', 'name email');
    res.json({ success: true, data: restaurants });
  } catch (error) {
    console.error("Error listing restaurants:", error);
    res.status(500).json({ success: false, message: "Error listing restaurants" });
  }
};

// Update restaurant
const updateRestaurant = async (req, res) => {
  console.log('updateRestaurant controller hit, ID:', req.params.id, 'File:', req.file ? req.file.filename : 'no file');
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate('owner', 'name email');

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?._id.toString() === restaurant.owner._id.toString();
    console.log('Auth check debug:', {
      userId: req.user._id,
      userRole: req.user.role,
      userRestaurantId: req.user.restaurantId,
      restaurantOwnerId: restaurant.owner._id.toString(),
      isAdmin,
      isOwner
    });

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Unauthorized: Only admin or owner can update" });
    }

    const { name, address, email, phone, description } = req.body;
    const updateData = { name, address, email, phone, description };

    // Upload ảnh lên Cloudinary nếu có
    if (req.file) {
      try {
        // Optional: Xóa ảnh cũ
        if (restaurant.image) {
          const publicId = restaurant.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`restaurants/${publicId}`);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'restaurants',
          resource_type: 'image',
        });
        updateData.image = result.secure_url;  // Full URL

        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.json({ success: false, message: "Error uploading image" });
      }
    }

    const updated = await Restaurant.findByIdAndUpdate(id, updateData, { new: true }).populate('owner', 'name email');
    res.json({ success: true, message: "Updated successfully", restaurant: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating restaurant" });
  }
};

// Create (thêm optional image upload nếu muốn, nhưng hiện tại no file)
const createRestaurant = async (req, res) => {
  try {
    console.log('POST / create hit');
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Only admins can create restaurants" });
    }
    const { name, address, phone, description, email, ownerEmail } = req.body;
    let imageUrl = null;

    const owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner user not found" });
    }
    if (owner.role !== 'restaurant_owner') {
      return res.status(403).json({ success: false, message: "User must be restaurant_owner" });
    }

    // Nếu thêm image cho create (tùy chọn), tương tự update
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'restaurants' });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const newRestaurant = new Restaurant({
      name,
      address,
      email,
      phone,
      description,
      image: imageUrl,  // Optional
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
    console.log('DELETE hit');
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.body;
    const restaurant = await Restaurant.findById(id);  // Fetch để xóa ảnh cũ
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    // Xóa ảnh trên Cloudinary nếu có
    if (restaurant.image) {
      const publicId = restaurant.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`restaurants/${publicId}`);
    }

    await Restaurant.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting" });
  }
};

export { createRestaurant, listRestaurants, updateRestaurant, deleteRestaurant };  // Xóa: upload (không export nữa)