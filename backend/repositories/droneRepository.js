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

/**
 * A drone must hold enough charge for the whole round trip. Dispatching one
 * that is nearly flat risks it coming down mid-flight, so anything below this
 * stays on the ground until it is charged.
 */
export const MIN_BATTERY_PERCENT = 30;

export const claimAvailable = async (orderId, cargoWeight) => {
  // Among the drones fit to fly, the least-used one goes first so wear spreads
  // evenly across the fleet.
  return await Drone.findOneAndUpdate(
    { status: "available", batteryLevel: { $gte: MIN_BATTERY_PERCENT } },
    {
      $set: {
        status: "delivering",
        currentOrder: orderId,
        cargoWeight,
      },
    },
    { new: true, sort: { totalDeliveries: 1 } }
  );
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
