import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import * as foodRepo from "../repositories/foodRepository.js";
import foodModel from "../models/foodModel.cjs";
export const addFood = async (user, foodData, file) => {
  if (user.role !== "restaurant_owner" || !user.restaurantId) {
    throw new Error(
      "Only restaurant owners with a valid restaurant can add food"
    );
  }
  const { name, description, price, category } = foodData;
  let imageUrl = null;

  if (!file) {
    throw new Error("Image required");
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: "foods",
    resource_type: "image",
  });
  imageUrl = result.secure_url;
  fs.unlinkSync(file.path);

  const newFoodData = {
    name,
    description,
    price,
    category,
    image: imageUrl,
    restaurantId: user.restaurantId,
  };
  const newFood = await foodRepo.create(newFoodData);
  return { success: true, message: "Food added successfully", food: newFood };
};

// SỬA: Cho phép user thường xem món ăn theo restaurantId
export const listFood = async (user, restaurantId) => {
  let filter = {};

  // Nếu có restaurantId trong query, filter theo đó (cho user thường xem trang nhà hàng)
  if (restaurantId) {
    filter.restaurantId = restaurantId;
  }
  // Nếu là restaurant owner, chỉ xem món của mình
  else if (user && user.role === "restaurant_owner" && user.restaurantId) {
    filter.restaurantId = user.restaurantId;
  }
  // Nếu là admin, xem tất cả
  else if (user && user.role === "admin") {
    filter = {};
  }
  // User thường không có restaurantId query -> trả về rỗng hoặc tất cả (tùy logic)
  else {
    // Có thể return empty hoặc all - ở đây return empty cho an toàn
    filter.restaurantId = null; // Sẽ không match gì cả
  }

  const foods = await foodRepo.findAll(filter);
  return { success: true, data: foods };
};

export const removeFood = async (user, id) => {
  const food = await foodRepo.findById(id);
  if (!food) {
    throw new Error("Food not found");
  }

  let foodRestIdStr = food.restaurantId;
  if (food.restaurantId && food.restaurantId._id) {
    foodRestIdStr = food.restaurantId._id.toString();
  } else if (typeof food.restaurantId === "object") {
    foodRestIdStr = food.restaurantId.toString();
  } else {
    foodRestIdStr = food.restaurantId;
  }

  const userRestIdStr = user.restaurantId
    ? typeof user.restaurantId === "object"
      ? user.restaurantId.toString()
      : user.restaurantId
    : null;

  if (user.role === "restaurant_owner" && userRestIdStr !== foodRestIdStr) {
    throw new Error("Unauthorized: Not your restaurant's food");
  }

  if (food.image) {
    const publicId = food.image.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`foods/${publicId}`);
  }

  await foodRepo.deleteById(id);
  return { success: true, message: "Food removed successfully" };
};

export const updateFood = async (user, updates, file) => {
  const { id, name, description, price, category } = updates;
  const food = await foodRepo.findById(id);

  if (!food) {
    throw new Error("Food not found");
  }

  let foodRestIdStr = food.restaurantId;
  if (food.restaurantId && food.restaurantId._id) {
    foodRestIdStr = food.restaurantId._id.toString();
  } else if (typeof food.restaurantId === "object") {
    foodRestIdStr = food.restaurantId.toString();
  } else {
    foodRestIdStr = food.restaurantId;
  }

  const userRestIdStr = user.restaurantId
    ? typeof user.restaurantId === "object"
      ? user.restaurantId.toString()
      : user.restaurantId
    : null;

  if (user.role === "restaurant_owner" && userRestIdStr !== foodRestIdStr) {
    throw new Error("Unauthorized: Not your restaurant's food");
  }

  const updateData = { name, description, price, category };

  if (file) {
    if (food.image) {
      const publicId = food.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`foods/${publicId}`);
    }
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "foods",
      resource_type: "image",
    });
    updateData.image = result.secure_url;
    fs.unlinkSync(file.path);
  }

  const updatedFood = await foodRepo.updateById(id, updateData);
  return {
    success: true,
    message: "Food updated successfully",
    food: updatedFood,
  };
};
export const getFoodById = async (foodId) => {
  try {
    const food = await foodModel
      .findById(foodId)
      .populate("restaurantId", "name address"); // Optional: populate restaurant info nếu cần
    if (!food) {
      return { success: false, message: "Food not found" };
    }
    return { success: true, data: food };
  } catch (error) {
    console.error("Service getFoodById error:", error);
    throw new Error("Failed to fetch food");
  }
};
