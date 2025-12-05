import Restaurant from "../models/restaurantModel.cjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import * as userRepo from "../repositories/userRepository.js";

// List restaurants
export const listRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).populate(
      "owner",
      "name email"
    );
    res.json({ success: true, data: restaurants });
  } catch (error) {
    console.error("List restaurants error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error listing restaurants" });
  }
};

// Update restaurant
export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.file) {
      try {
        const currentRestaurant = await Restaurant.findById(id);

        if (currentRestaurant && currentRestaurant.image) {
          try {
            const publicId = currentRestaurant.image
              .split("/")
              .pop()
              .split(".")[0];
            await cloudinary.uploader.destroy(`restaurants/${publicId}`);
          } catch (deleteError) {
            console.warn("Could not delete old image:", deleteError);
          }
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "restaurants",
          resource_type: "image",
        });

        updates.image = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
        });
      }
    }

    const restaurant = await Restaurant.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    res.json({
      success: true,
      message: "Restaurant updated successfully",
      data: restaurant,
    });
  } catch (error) {
    console.error("Update restaurant error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating restaurant" });
  }
};

// Create restaurant
export const createRestaurant = async (req, res) => {
  try {
    const data = req.body;
    let imageUrl = null;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "restaurants",
          resource_type: "image",
        });
        imageUrl = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
        });
      }
    }

    data.image = imageUrl;
    data.owner = req.user._id;

    const newRestaurant = new Restaurant(data);
    await newRestaurant.save();

    await userRepo.updateById(req.user._id, {
      restaurantId: newRestaurant._id,
    });

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: newRestaurant,
    });
  } catch (error) {
    console.error("Create restaurant error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating restaurant" });
  }
};

// Delete restaurant - Chỉ xóa được nếu chưa có order nào
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.body;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    // Kiểm tra xem nhà hàng đã có order nào chưa (bất kể trạng thái)
    const Order = (await import("../models/orderModel.cjs")).default;
    const totalOrders = await Order.countDocuments({ restaurantId: id });

    if (totalOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa nhà hàng. Nhà hàng này đã có ${totalOrders} đơn hàng trong hệ thống.`,
      });
    }

    if (restaurant.image) {
      try {
        const publicId = restaurant.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`restaurants/${publicId}`);
      } catch (deleteError) {
        console.warn("Could not delete image:", deleteError);
      }
    }

    await Restaurant.findByIdAndDelete(id);
    res.json({ success: true, message: "Restaurant deleted successfully" });
  } catch (error) {
    console.error("Delete restaurant error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting restaurant" });
  }
};

// Get restaurant by ID
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate(
      "owner",
      "name email"
    );
    if (!restaurant)
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error("Get restaurant by ID error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching restaurant" });
  }
};

// Lock/Unlock restaurant - SỬA: Đồng bộ với frontend
export const lockRestaurant = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  try {
    const { id } = req.params;
    const { isLocked } = req.body; // SỬA: Nhận isLocked từ frontend

    if (typeof isLocked !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isLocked must be a boolean",
      });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { isLocked: isLocked },
      { new: true }
    );

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    res.json({
      success: true,
      message: `Restaurant ${isLocked ? "locked" : "unlocked"} successfully`,
      data: restaurant,
    });
  } catch (error) {
    console.error("Lock restaurant error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error locking restaurant" });
  }
};
