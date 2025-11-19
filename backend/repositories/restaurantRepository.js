// backend/repositories/restaurantRepository.js
import { Restaurant } from "../models/index.cjs";

export const findAll = async () => {
  return await Restaurant.find({}).populate("owner", "name email"); // Populate owner ref
};

export const findById = async (id) => {
  return await Restaurant.findById(id).populate("owner", "name email");
};

export const create = async (restaurantData) => {
  const { name, address, email, owner } = restaurantData;
  if (!name || !address || !email || !owner) {
    throw new Error("Missing required fields for Restaurant");
  }
  const restaurant = new Restaurant(restaurantData);
  return await restaurant.save();
};

export const updateById = async (id, updates) => {
  return await Restaurant.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await Restaurant.findByIdAndDelete(id);
};

export const countDocuments = async () => {
  return await Restaurant.countDocuments();
};
