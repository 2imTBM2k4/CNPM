import restaurantModel from "../models/restaurantModel.cjs";
import userModel from "../models/userModel.cjs";

// Create restaurant (admin only)
const createRestaurant = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: "Only admins can create restaurants" });
    }
    const { name, address, phone, description, ownerEmail } = req.body;

    // Tạo user owner nếu cần (assume register owner riêng, hoặc tạo ở đây)
    const owner = await userModel.findOne({ email: ownerEmail });
    if (!owner) {
      return res.json({ success: false, message: "Owner user not found" });
    }
    if (owner.role !== 'restaurant_owner') {
      return res.json({ success: false, message: "User must be restaurant_owner" });
    }

    const newRestaurant = new restaurantModel({
      name,
      address,
      phone,
      description,
      owner: owner._id
    });
    await newRestaurant.save();

    // Update user với restaurantId
    await userModel.findByIdAndUpdate(owner._id, { restaurantId: newRestaurant._id });

    res.json({ success: true, message: "Restaurant created", restaurant: newRestaurant });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// List restaurants (admin only)
const listRestaurants = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const restaurants = await restaurantModel.find({}).populate('owner', 'name email');
    res.json({ success: true, data: restaurants });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update restaurant (admin only)
const updateRestaurant = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const { id, name, address, phone, description } = req.body;
    const updated = await restaurantModel.findByIdAndUpdate(id, { name, address, phone, description }, { new: true });
    if (!updated) {
      return res.json({ success: false, message: "Restaurant not found" });
    }
    res.json({ success: true, message: "Updated", restaurant: updated });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// Delete restaurant (admin only)
const deleteRestaurant = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.body;
    await restaurantModel.findByIdAndDelete(id);
    // Optional: Xóa food/order liên quan, hoặc set null
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

export { createRestaurant, listRestaurants, updateRestaurant, deleteRestaurant };