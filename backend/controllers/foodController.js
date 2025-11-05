import foodModel from "../models/foodModel.cjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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

    if (req.file) {
      try {
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
    } else {
      return res.json({ success: false, message: "Image required" });
    }

    const newFood = new foodModel({
      name,
      description,
      price,
      category,
      image: imageUrl,
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

// List food items
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

// Remove food
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

    // Xóa ảnh trên Cloudinary nếu có
    if (food.image) {
      const publicId = food.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`foods/${publicId}`);
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

    if (req.file) {
      try {
        if (food.image) {
          const publicId = food.image.split("/").pop().split(".")[0];
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
