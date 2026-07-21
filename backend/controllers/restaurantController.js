import * as restaurantService from "../services/restaurantService.js";
import fs from "fs";

export const listRestaurants = async (req, res) => {
  try {
    const result = await restaurantService.listRestaurants();
    res.json(result);
  } catch (error) {
    console.error("List restaurants error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error listing restaurants" });
  }
};

export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await restaurantService.updateRestaurant(
      id,
      req.body,
      req.file
    );
    res.json(result);
  } catch (error) {
    console.error("Update restaurant error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const status = error.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const result = await restaurantService.createRestaurant(
      req.user,
      req.body,
      req.file
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("Create restaurant error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res
      .status(500)
      .json({ success: false, message: "Error creating restaurant" });
  }
};

export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.body;
    const result = await restaurantService.deleteRestaurant(id);
    res.json(result);
  } catch (error) {
    console.error("Delete restaurant error:", error);
    const status = error.message.includes("not found")
      ? 404
      : error.message.includes("Không thể xóa")
      ? 400
      : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await restaurantService.getRestaurantById(id);
    res.json(result);
  } catch (error) {
    console.error("Get restaurant by ID error:", error);
    const status = error.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const lockRestaurant = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  try {
    const { id } = req.params;
    const { isLocked } = req.body;
    const result = await restaurantService.lockRestaurant(id, isLocked);
    res.json(result);
  } catch (error) {
    console.error("Lock restaurant error:", error);
    const status = error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
