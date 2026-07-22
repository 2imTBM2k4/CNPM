import * as restaurantService from "../services/restaurantService.js";
import fs from "fs";

export const listRestaurants = async (req, res) => {
  try {
    const result = await restaurantService.listRestaurants();
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
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
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
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
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.body;
    const result = await restaurantService.deleteRestaurant(id);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await restaurantService.getRestaurantById(id);
    res.json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
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
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};
