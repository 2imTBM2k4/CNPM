import Restaurant from "../models/restaurantModel.cjs";

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
      updates.image = req.file.filename; // Giả định dùng multer
    }
    const restaurant = await Restaurant.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!restaurant)
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    res.json({ success: true, data: restaurant });
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
    if (req.file) {
      data.image = req.file.filename;
    }
    data.owner = req.user._id; // Giả định từ auth
    const newRestaurant = new Restaurant(data);
    await newRestaurant.save();
    res.status(201).json({ success: true, data: newRestaurant });
  } catch (error) {
    console.error("Create restaurant error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating restaurant" });
  }
};

// Delete restaurant
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.body; // Hoặc req.params.id nếu dùng DELETE /:id
    const restaurant = await Restaurant.findByIdAndDelete(id);
    if (!restaurant)
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    res.json({ success: true, message: "Restaurant deleted" });
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

// Lock restaurant
export const lockRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { lock } = req.body;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant)
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    restaurant.locked = lock;
    await restaurant.save();
    res.json({
      success: true,
      message: `Restaurant ${lock ? "locked" : "unlocked"}`,
    });
  } catch (error) {
    console.error("Lock restaurant error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error locking restaurant" });
  }
};
