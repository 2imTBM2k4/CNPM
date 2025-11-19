import Drone from "../models/droneModel.cjs";

export const findAll = async () => {
  return await Drone.find().populate("currentOrder").sort({ createdAt: -1 });
};

export const findById = async (id) => {
  return await Drone.findById(id).populate("currentOrder");
};

export const findByCode = async (droneCode) => {
  return await Drone.findOne({ droneCode });
};

export const findAvailable = async () => {
  return await Drone.find({ status: "available" }).sort({ totalDeliveries: 1 });
};

export const create = async (droneData) => {
  const drone = new Drone(droneData);
  return await drone.save();
};

export const update = async (id, updateData) => {
  return await Drone.findByIdAndUpdate(id, updateData, { new: true });
};

export const deleteById = async (id) => {
  return await Drone.findByIdAndDelete(id);
};
