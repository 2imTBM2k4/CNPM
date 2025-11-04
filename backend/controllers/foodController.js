// import foodModel from "../models/foodModel.cjs";

// // Add a new food item (giữ nguyên)
// const addFood = async (req, res) => {
//   try {
//     if (req.user.role !== 'restaurant_owner' || !req.user.restaurantId) {
//       return res.json({ success: false, message: "Only restaurant owners with a valid restaurant can add food" });
//     }
//     const { name, description, price, category } = req.body;
//     const image = req.file ? req.file.filename : null;

//     if (!name || !description || !price || !category || !image) {
//       return res.json({ success: false, message: "Missing required fields" });
//     }

//     const newFood = new foodModel({
//       name,
//       description,
//       price,
//       category,
//       image,
//       restaurantId: req.user.restaurantId  // Attach from authenticated user
//     });

//     await newFood.save();
//     res.json({ success: true, message: "Food added successfully", food: newFood });
//   } catch (error) {
//     console.error("Error adding food:", error);
//     res.json({ success: false, message: "Error adding food" });
//   }
// };

// // List all food items (sửa: thêm filter by query.restaurantId)
// const listFood = async (req, res) => {
//   try {
//     let foods;
//     const { restaurantId } = req.query;  // Thêm query param
//     console.log('List food - req.user:', req.user);  // Giữ log

//     if (restaurantId) {
//       foods = await foodModel.find({ restaurantId });  // Filter public theo restaurantId
//     } else if (req.user && req.user.role === 'restaurant_owner' && req.user.restaurantId) {
//       foods = await foodModel.find({ restaurantId: req.user.restaurantId });
//     } else if (req.user && req.user.role === 'admin') {
//       foods = await foodModel.find({});
//     } else {
//       foods = await foodModel.find({});  // Public: All foods
//     }
//     res.json({ success: true, data: foods });
//   } catch (error) {
//     console.error("Error listing foods:", error);
//     res.json({ success: false, message: "Error listing foods" });
//   }
// };

// // Remove và update giữ nguyên
// const removeFood = async (req, res) => {
//   try {
//     const { id } = req.body;
//     const food = await foodModel.findById(id);
//     if (!food || (req.user.role === 'restaurant_owner' && req.user.restaurantId && food.restaurantId.toString() !== req.user.restaurantId.toString())) {
//       return res.json({ success: false, message: "Food not found or unauthorized" });
//     }
//     await foodModel.findByIdAndDelete(id);
//     res.json({ success: true, message: "Food removed successfully" });
//   } catch (error) {
//     console.error("Error removing food:", error);
//     res.json({ success: false, message: "Error removing food" });
//   }
// };

// const updateFood = async (req, res) => {
//   try {
//     const { id, name, description, price, category } = req.body;
//     const image = req.file ? req.file.filename : undefined;

//     const food = await foodModel.findById(id);
//     if (!food || (req.user.role === 'restaurant_owner' && food.restaurantId.toString() !== req.user.restaurantId.toString())) {
//       return res.json({ success: false, message: "Food not found or unauthorized" });
//     }

//     const updateData = { name, description, price, category };
//     if (image) updateData.image = image;

//     const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true });
//     res.json({ success: true, message: "Food updated successfully", food: updatedFood });
//   } catch (error) {
//     console.error("Error updating food:", error);
//     res.json({ success: false, message: "Error updating food" });
//   }
// };

// export { addFood, listFood, removeFood, updateFood };

import foodModel from "../models/foodModel.cjs";
import { v2 as cloudinary } from "cloudinary"; // Thêm
import fs from "fs"; // Thêm để xóa file local

// Add a new food item
const addFood = async (req, res) => {
  try {
    if (req.user.role !== "restaurant_owner" || !req.user.restaurantId) {
      return res.json({
        success: false,
        message: "Only restaurant owners with a valid restaurant can add food",
      });
    }
    const { name, description, price, category } = req.body;
    let imageUrl = null;

    if (!name || !description || !price || !category) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Upload ảnh lên Cloudinary nếu có file
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "foods", // Folder trên Cloudinary
          resource_type: "image", // Đảm bảo là image
        });
        imageUrl = result.secure_url; // Lưu URL an toàn (HTTPS)

        // Xóa file local sau upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Xóa file nếu upload fail
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.json({ success: false, message: "Error uploading image" });
      }
    } else {
      return res.json({ success: false, message: "Image is required" });
    }

    const newFood = new foodModel({
      name,
      description,
      price,
      category,
      image: imageUrl, // Lưu full URL
      restaurantId: req.user.restaurantId,
    });

    await newFood.save();
    res.json({
      success: true,
      message: "Food added successfully",
      food: newFood,
    });
  } catch (error) {
    console.error("Error adding food:", error);
    res.json({ success: false, message: "Error adding food" });
  }
};

// List all food items (không thay đổi)
const listFood = async (req, res) => {
  try {
    let foods;
    const { restaurantId } = req.query;
    console.log("List food - req.user:", req.user);

    if (restaurantId) {
      foods = await foodModel.find({ restaurantId });
    } else if (
      req.user &&
      req.user.role === "restaurant_owner" &&
      req.user.restaurantId
    ) {
      foods = await foodModel.find({ restaurantId: req.user.restaurantId });
    } else if (req.user && req.user.role === "admin") {
      foods = await foodModel.find({});
    } else {
      foods = await foodModel.find({});
    }
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error("Error listing foods:", error);
    res.json({ success: false, message: "Error listing foods" });
  }
};

// Remove (không thay đổi)
const removeFood = async (req, res) => {
  try {
    const { id } = req.body;
    const food = await foodModel.findById(id);
    if (
      !food ||
      (req.user.role === "restaurant_owner" &&
        req.user.restaurantId &&
        food.restaurantId.toString() !== req.user.restaurantId.toString())
    ) {
      return res.json({
        success: false,
        message: "Food not found or unauthorized",
      });
    }
    await foodModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Food removed successfully" });
  } catch (error) {
    console.error("Error removing food:", error);
    res.json({ success: false, message: "Error removing food" });
  }
};

// Update food
const updateFood = async (req, res) => {
  try {
    const { id, name, description, price, category } = req.body;
    let imageUrl = null;

    const food = await foodModel.findById(id);
    if (
      !food ||
      (req.user.role === "restaurant_owner" &&
        food.restaurantId.toString() !== req.user.restaurantId.toString())
    ) {
      return res.json({
        success: false,
        message: "Food not found or unauthorized",
      });
    }

    const updateData = { name, description, price, category };

    // Upload ảnh mới nếu có (thay thế cũ)
    if (req.file) {
      try {
        // Optional: Xóa ảnh cũ trên Cloudinary nếu có public_id
        if (food.image) {
          const publicId = food.image.split("/").pop().split(".")[0]; // Extract public_id từ URL
          await cloudinary.uploader.destroy(`foods/${publicId}`);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "foods",
          resource_type: "image",
        });
        imageUrl = result.secure_url;

        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.json({ success: false, message: "Error uploading image" });
      }
      updateData.image = imageUrl;
    }

    const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    res.json({
      success: true,
      message: "Food updated successfully",
      food: updatedFood,
    });
  } catch (error) {
    console.error("Error updating food:", error);
    res.json({ success: false, message: "Error updating food" });
  }
};

export { addFood, listFood, removeFood, updateFood };
