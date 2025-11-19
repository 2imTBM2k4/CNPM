import * as foodService from "../services/foodService.js";

// Add a new food item
export const addFood = async (req, res) => {
  try {
    if (!req.body.name || !req.body.price || !req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Name, price, and image required" });
    }
    const result = await foodService.addFood(req.user, req.body, req.file);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding food:", error);
    res
      .status(400)
      .json({ success: false, message: error.message || "Error adding food" });
  }
};

// List food items
// ... (giữ nguyên imports)

export const listFood = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const result = await foodService.listFood(req.user, restaurantId); // req.user có thể undefined (optionalAuth)
    res.json(result);
  } catch (error) {
    console.error("Error listing foods:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error listing foods",
    });
  }
};

// Remove food
export const removeFood = async (req, res) => {
  const { id } = req.body;
  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Food ID required" });
    }
    const result = await foodService.removeFood(req.user, id);
    res.json(result);
  } catch (error) {
    console.error("Error removing food:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error removing food",
    });
  }
};

// Update food
export const updateFood = async (req, res) => {
  const { id, name, description, price, category } = req.body;
  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Food ID required" });
    }
    const result = await foodService.updateFood(
      req.user,
      { id, name, description, price, category },
      req.file
    );
    res.json(result);
  } catch (error) {
    console.error("Error updating food:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating food",
    });
  }
};
export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Food ID required" });
    }
    const result = await foodService.getFoodById(id); // Gọi service (sẽ tạo bên dưới)
    res.json(result);
  } catch (error) {
    console.error("Error getting food by ID:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error getting food",
    });
  }
};
