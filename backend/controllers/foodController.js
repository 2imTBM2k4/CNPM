// import foodModel from "../models/foodModel.cjs";

// // Add a new food item
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
// // List all food items (filter by restaurant nếu là owner)
// const listFood = async (req, res) => {
//   try {
//     let foods;
//     console.log('List food - req.user:', req.user);  // Mới: Log để check req.user có set không
//     if (req.user && req.user.role === 'restaurant_owner' && req.user.restaurantId) {
//       foods = await foodModel.find({ restaurantId: req.user.restaurantId });
//     } else if (req.user && req.user.role === 'admin') {
//       foods = await foodModel.find({});
//     } else {
//       foods = await foodModel.find({});  // Public or invalid: All foods
//     }
//     res.json({ success: true, data: foods });
//   } catch (error) {
//     console.error("Error listing foods:", error);
//     res.json({ success: false, message: "Error listing foods" });
//   }
// };

// // Remove a food item (check ownership)
// // Remove a food item (check ownership)
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
// // Update a food item (check ownership)
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

// Add a new food item (giữ nguyên)
const addFood = async (req, res) => {
  try {
    if (req.user.role !== 'restaurant_owner' || !req.user.restaurantId) {
      return res.json({ success: false, message: "Only restaurant owners with a valid restaurant can add food" });
    }
    const { name, description, price, category } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !description || !price || !category || !image) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const newFood = new foodModel({
      name,
      description,
      price,
      category,
      image,
      restaurantId: req.user.restaurantId  // Attach from authenticated user
    });

    await newFood.save();
    res.json({ success: true, message: "Food added successfully", food: newFood });
  } catch (error) {
    console.error("Error adding food:", error);
    res.json({ success: false, message: "Error adding food" });
  }
};

// List all food items (sửa: thêm filter by query.restaurantId)
const listFood = async (req, res) => {
  try {
    let foods;
    const { restaurantId } = req.query;  // Thêm query param
    console.log('List food - req.user:', req.user);  // Giữ log

    if (restaurantId) {
      foods = await foodModel.find({ restaurantId });  // Filter public theo restaurantId
    } else if (req.user && req.user.role === 'restaurant_owner' && req.user.restaurantId) {
      foods = await foodModel.find({ restaurantId: req.user.restaurantId });
    } else if (req.user && req.user.role === 'admin') {
      foods = await foodModel.find({});
    } else {
      foods = await foodModel.find({});  // Public: All foods
    }
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error("Error listing foods:", error);
    res.json({ success: false, message: "Error listing foods" });
  }
};

// Remove và update giữ nguyên
const removeFood = async (req, res) => {
  try {
    const { id } = req.body;
    const food = await foodModel.findById(id);
    if (!food || (req.user.role === 'restaurant_owner' && req.user.restaurantId && food.restaurantId.toString() !== req.user.restaurantId.toString())) {
      return res.json({ success: false, message: "Food not found or unauthorized" });
    }
    await foodModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Food removed successfully" });
  } catch (error) {
    console.error("Error removing food:", error);
    res.json({ success: false, message: "Error removing food" });
  }
};

const updateFood = async (req, res) => {
  try {
    const { id, name, description, price, category } = req.body;
    const image = req.file ? req.file.filename : undefined;

    const food = await foodModel.findById(id);
    if (!food || (req.user.role === 'restaurant_owner' && food.restaurantId.toString() !== req.user.restaurantId.toString())) {
      return res.json({ success: false, message: "Food not found or unauthorized" });
    }

    const updateData = { name, description, price, category };
    if (image) updateData.image = image;

    const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, message: "Food updated successfully", food: updatedFood });
  } catch (error) {
    console.error("Error updating food:", error);
    res.json({ success: false, message: "Error updating food" });
  }
};

export { addFood, listFood, removeFood, updateFood };