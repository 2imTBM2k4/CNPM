import Restaurant from "../models/restaurantModel.cjs";
import User from "../models/userModel.cjs";
import { v2 as cloudinary } from "cloudinary"; // Thêm
import fs from "fs"; // Thêm

// List (không thay đổi)
const listRestaurants = async (req, res) => {
  try {
    console.log("GET /list hit");
    const restaurants = await Restaurant.find({}).populate(
      "owner",
      "name email"
    );
    res.json({ success: true, data: restaurants });
  } catch (error) {
    console.error("Error listing restaurants:", error);
    res
      .status(500)
      .json({ success: false, message: "Error listing restaurants" });
  }
};

// Update restaurant (fix: allow admin edit any, owner chỉ own)
const updateRestaurant = async (req, res) => {
  console.log(
    "updateRestaurant controller hit, ID:",
    req.params.id,
    "File:",
    req.file ? req.file.filename : "no file"
  );
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate(
      "owner",
      "name email"
    );

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner =
      req.user?._id.toString() === restaurant.owner._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only admin or owner can update",
      });
    }

    const { name, address, email, phone, description } = req.body;
    const updateData = { name, address, email, phone, description };

    // Upload ảnh lên Cloudinary nếu có
    if (req.file) {
      try {
        // Optional: Xóa ảnh cũ
        if (restaurant.image) {
          const publicId = restaurant.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`restaurants/${publicId}`);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "restaurants",
          resource_type: "image",
        });
        updateData.image = result.secure_url; // Full URL

        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.json({ success: false, message: "Error uploading image" });
      }
    }

    const updated = await Restaurant.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("owner", "name email");
    res.json({
      success: true,
      message: "Updated successfully",
      restaurant: updated,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error updating restaurant" });
  }
};

// Create (thêm optional image upload nếu muốn, nhưng hiện tại no file)
const createRestaurant = async (req, res) => {
  try {
    console.log("POST / create hit");
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create restaurants",
      });
    }
    const { name, address, phone, description, email, ownerEmail } = req.body;
    let imageUrl = null;

    const owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "Owner user not found" });
    }
    if (owner.role !== "restaurant_owner") {
      return res
        .status(403)
        .json({ success: false, message: "User must be restaurant_owner" });
    }

    // Nếu thêm image cho create (tùy chọn), tương tự update
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "restaurants",
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const newRestaurant = new Restaurant({
      name,
      address,
      email,
      phone,
      description,
      image: imageUrl, // Optional
      owner: owner._id,
    });
    await newRestaurant.save();

    await User.findByIdAndUpdate(owner._id, {
      restaurantId: newRestaurant._id,
    });

    res.status(201).json({
      success: true,
      message: "Restaurant created",
      restaurant: newRestaurant,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error creating restaurant" });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    console.log("DELETE hit");
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.body;
    const restaurant = await Restaurant.findById(id); // Fetch để xóa ảnh cũ
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    // Xóa ảnh trên Cloudinary nếu có
    if (restaurant.image) {
      const publicId = restaurant.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`restaurants/${publicId}`);
    }

    await Restaurant.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting" });
  }
};

export {
  createRestaurant,
  listRestaurants,
  updateRestaurant,
  deleteRestaurant,
};
