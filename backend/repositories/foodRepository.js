import { Food } from "../models/index.cjs";

export const create = async (foodData) => {
  const { name, description, price, image, category, restaurantId } = foodData;
  if (
    !name ||
    !description ||
    price <= 0 ||
    !image ||
    !category ||
    !restaurantId
  ) {
    throw new Error("Missing required fields for Food");
  }
  const food = new Food(foodData);
  return await food.save();
};

// ✅ FIX: Không populate cho user view, chỉ populate cho admin/owner nếu cần
export const findAll = async (filter = {}, { page, limit } = {}) => {
  let query = Food.find(filter);
  let total;

  if (page && limit) {
    total = await Food.countDocuments(filter);
    query = query.skip((page - 1) * limit).limit(limit);
  }

  const foods = await query.lean();
  const data = foods.map(food => ({
    ...food,
    restaurantId: food.restaurantId?.toString() || food.restaurantId
  }));

  if (page && limit) {
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  return { data };
};

export const findById = async (id) => {
  const food = await Food.findById(id).lean();
  if (food && food.restaurantId) {
    food.restaurantId = food.restaurantId.toString();
  }
  return food;
};

export const updateById = async (id, updates) => {
  return await Food.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).lean();
};

export const deleteById = async (id) => {
  return await Food.findByIdAndDelete(id);
};
