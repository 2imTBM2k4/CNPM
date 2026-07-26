import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import * as restaurantRepo from "../repositories/restaurantRepository.js";
import * as userRepo from "../repositories/userRepository.js";
import AppError from "../utils/AppError.js";

export const listRestaurants = async ({ page, limit } = {}) => {
  const result = await restaurantRepo.findAll({ page, limit });
  return { success: true, data: result.data, ...(result.pagination && { pagination: result.pagination }) };
};

export const updateRestaurant = async (id, updates, file) => {
  if (file) {
    const current = await restaurantRepo.findById(id);
    if (current && current.image) {
      try {
        const publicId = current.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`restaurants/${publicId}`);
      } catch (deleteError) {
        console.warn("Could not delete old image:", deleteError);
      }
    }
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "restaurants",
      resource_type: "image",
    });
    updates.image = result.secure_url;
    fs.unlinkSync(file.path);
  }
  const restaurant = await restaurantRepo.updateById(id, updates);
  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }
  return {
    success: true,
    message: "Restaurant updated successfully",
    data: restaurant,
  };
};

export const createRestaurant = async (user, data, file) => {
  let imageUrl = null;
  if (file) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "restaurants",
      resource_type: "image",
    });
    imageUrl = result.secure_url;
    fs.unlinkSync(file.path);
  }
  const restaurantData = { ...data, image: imageUrl, owner: user._id };
  const newRestaurant = await restaurantRepo.create(restaurantData);

  await userRepo.updateById(user._id, { restaurantId: newRestaurant._id });

  return {
    success: true,
    message: "Restaurant created successfully",
    data: newRestaurant,
  };
};

export const deleteRestaurant = async (id) => {
  const restaurant = await restaurantRepo.findById(id);
  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  const { Order } = await import("../models/index.cjs");
  const totalOrders = await Order.countDocuments({ restaurantId: id });
  if (totalOrders > 0) {
    throw new AppError(
      `Không thể xóa nhà hàng. Nhà hàng này đã có ${totalOrders} đơn hàng trong hệ thống.`,
      409
    );
  }

  if (restaurant.image) {
    try {
      const publicId = restaurant.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`restaurants/${publicId}`);
    } catch (deleteError) {
      console.warn("Could not delete image:", deleteError);
    }
  }
  await restaurantRepo.deleteById(id);
  return { success: true, message: "Restaurant deleted successfully" };
};

export const getRestaurantById = async (id) => {
  const restaurant = await restaurantRepo.findById(id);
  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }
  return { success: true, data: restaurant };
};

export const lockRestaurant = async (id, isLocked) => {
  if (typeof isLocked !== "boolean") {
    throw new AppError("isLocked must be a boolean", 400);
  }
  const restaurant = await restaurantRepo.updateById(id, { isLocked });
  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }
  return {
    success: true,
    message: `Restaurant ${isLocked ? "locked" : "unlocked"} successfully`,
    data: restaurant,
  };
};
