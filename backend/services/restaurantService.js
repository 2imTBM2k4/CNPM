import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import * as restaurantRepo from "../repositories/restaurantRepository.js";

export const listRestaurants = async () => {
  console.log("listRestaurants called"); // DEBUG
  const restaurants = await restaurantRepo.findAll();
  return { success: true, data: restaurants };
};

export const updateRestaurant = async (id, updates, file) => {
  console.log("updateRestaurant - ID:", id); // DEBUG
  let imageUrl = null;
  if (file) {
    const current = await restaurantRepo.findById(id);
    console.log(
      "updateRestaurant - Current restaurant:",
      current ? { _id: current._id, image: !!current.image } : "null"
    ); // DEBUG
    if (current && current.image) {
      const publicId = current.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`restaurants/${publicId}`);
    }
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "restaurants",
      resource_type: "image",
    });
    imageUrl = result.secure_url;
    fs.unlinkSync(file.path);
    updates.image = imageUrl;
  }
  const restaurant = await restaurantRepo.updateById(id, updates);
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }
  return {
    success: true,
    message: "Restaurant updated successfully",
    data: restaurant,
  };
};

export const createRestaurant = async (user, data, file) => {
  console.log("createRestaurant - User:", { _id: user._id, role: user.role }); // DEBUG
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
  return {
    success: true,
    message: "Restaurant created successfully",
    data: newRestaurant,
  };
};

export const deleteRestaurant = async (id) => {
  console.log("deleteRestaurant - ID:", id); // DEBUG
  const restaurant = await restaurantRepo.findById(id);
  console.log(
    "deleteRestaurant - Found:",
    restaurant ? { _id: restaurant._id } : "null"
  ); // DEBUG
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }
  if (restaurant.image) {
    const publicId = restaurant.image.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`restaurants/${publicId}`);
  }
  await restaurantRepo.deleteById(id);
  return { success: true, message: "Restaurant deleted successfully" };
};

export const getRestaurantById = async (id) => {
  console.log("getRestaurantById - ID:", id); // DEBUG
  const restaurant = await restaurantRepo.findById(id);
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }
  return { success: true, data: restaurant };
};

export const lockRestaurant = async (id, lock) => {
  console.log("lockRestaurant - Params:", {
    id,
    lock,
    callerRole: "from service",
  }); // DEBUG (thêm caller nếu cần từ controller)
  const restaurant = await restaurantRepo.findById(id);
  console.log(
    "lockRestaurant - Found restaurant:",
    restaurant ? { _id: restaurant._id, isLocked: restaurant.isLocked } : "null"
  ); // DEBUG
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }
  await restaurantRepo.updateById(id, { isLocked: lock });
  console.log("lockRestaurant - Updated to:", lock); // DEBUG
  return {
    success: true,
    message: `Restaurant ${lock ? "locked" : "unlocked"}`,
  };
};
