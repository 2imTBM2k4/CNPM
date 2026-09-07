import { Order, ShipperProfile } from "../models/index.cjs";
import AppError from "../utils/AppError.js";
import { recordAudit } from "../utils/auditLog.js";
import * as orderService from "./orderService.js";

const LOCATION_STALE_MS = 90 * 1000;
const OFFER_RADIUS_METRES = 3000;

const getProfile = async (userId) => {
  const profile = await ShipperProfile.findOne({ user: userId });
  if (!profile) throw new AppError("Shipper profile not found", 404);
  return profile;
};

const requireApproved = (profile) => {
  if (profile.approvalStatus !== "approved") {
    throw new AppError("Shipper profile is pending approval", 403);
  }
};

const requireFreshLocation = (profile) => {
  const fresh = profile.locationUpdatedAt && Date.now() - profile.locationUpdatedAt.getTime() <= LOCATION_STALE_MS;
  if (!fresh || !Array.isArray(profile.currentLocation?.coordinates) || profile.currentLocation.coordinates.length !== 2) {
    throw new AppError("A live location updated within 90 seconds is required", 409);
  }
};

export const me = async (userId) => ({ success: true, data: await getProfile(userId) });

export const updateLocation = async (userId, { lat, lng, pushToken }) => {
  const profile = await getProfile(userId);
  requireApproved(profile);
  if (profile.status === "offline") throw new AppError("Set status to available before sharing location", 409);

  const now = new Date();
  const updated = await ShipperProfile.findOneAndUpdate(
    { _id: profile._id },
    {
      $set: {
        currentLocation: { type: "Point", coordinates: [lng, lat] },
        locationUpdatedAt: now,
        ...(pushToken !== undefined && { pushToken: pushToken || "" }),
      },
    },
    { new: true, runValidators: true }
  );
  return { success: true, data: updated };
};

export const updateStatus = async (userId, status) => {
  const profile = await getProfile(userId);
  requireApproved(profile);
  if (profile.currentOrder && status === "offline") {
    throw new AppError("Cannot go offline while an order is assigned", 409);
  }
  const updated = await ShipperProfile.findByIdAndUpdate(
    profile._id,
    { $set: { status } },
    { new: true, runValidators: true }
  );
  return { success: true, data: updated };
};

export const availableOrders = async (userId) => {
  const profile = await getProfile(userId);
  requireApproved(profile);
  requireFreshLocation(profile);
  if (profile.status !== "available") return { success: true, data: [] };

  const now = new Date();
  const orders = await Order.find({
    deliveryMethod: "shipper",
    shipperAssignmentStatus: "unassigned",
    orderStatus: "pending",
    shipperAssignmentDeadlineAt: { $gt: now },
    pickupLocation: {
      $near: {
        $geometry: profile.currentLocation,
        $maxDistance: OFFER_RADIUS_METRES,
      },
    },
  }).populate("restaurantId", "name address phone");
  return { success: true, data: orders };
};

export const nearbyAvailableShipperIds = async (pickupLocation) => {
  if (!pickupLocation?.coordinates) return [];
  const freshAfter = new Date(Date.now() - LOCATION_STALE_MS);
  const profiles = await ShipperProfile.find({
    status: "available",
    approvalStatus: "approved",
    locationUpdatedAt: { $gte: freshAfter },
    currentLocation: { $near: { $geometry: pickupLocation, $maxDistance: OFFER_RADIUS_METRES } },
  }).limit(10).select("user");
  return profiles.map((profile) => String(profile.user));
};

export const acceptOrder = async (user, orderId) => {
  const profile = await getProfile(user._id);
  requireApproved(profile);
  requireFreshLocation(profile);
  if (profile.status !== "available" || profile.currentOrder) {
    throw new AppError("Shipper is not available", 409);
  }

  const claimedProfile = await ShipperProfile.findOneAndUpdate(
    { _id: profile._id, status: "available", currentOrder: null },
    { $set: { status: "assigned", currentOrder: orderId } },
    { new: true }
  );
  if (!claimedProfile) throw new AppError("Shipper is no longer available", 409);

  const now = new Date();
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      deliveryMethod: "shipper",
      shipperAssignmentStatus: "unassigned",
      orderStatus: "pending",
      shipperAssignmentDeadlineAt: { $gt: now },
    },
    {
      $set: {
        shipperId: user._id,
        shipperAssignmentStatus: "accepted",
        shipperAcceptedAt: now,
      },
    },
    { new: true }
  );

  if (!order) {
    await ShipperProfile.findByIdAndUpdate(profile._id, { $set: { status: "available", currentOrder: null } });
    throw new AppError("Order is no longer available", 409);
  }
  await recordAudit({ actor: user, action: "shipper.order_accepted", targetType: "order", targetId: order._id });
  return { success: true, data: order };
};

export const pickupOrder = async (user, orderId) => {
  const now = new Date();
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      deliveryMethod: "shipper",
      shipperId: user._id,
      shipperAssignmentStatus: "accepted",
      orderStatus: "preparing",
    },
    { $set: { orderStatus: "delivering", shipperAssignmentStatus: "picked_up", shipperPickedUpAt: now } },
    { new: true }
  );
  if (!order) throw new AppError("Order is not ready for pickup", 409);
  await ShipperProfile.findOneAndUpdate({ user: user._id, currentOrder: order._id }, { $set: { status: "delivering" } });
  await recordAudit({ actor: user, action: "shipper.order_picked_up", targetType: "order", targetId: order._id });
  return { success: true, data: order };
};

export const completeOrder = async (user, orderId) => {
  const result = await orderService.updateStatus(user, { orderId, status: "delivered" });
  await ShipperProfile.findOneAndUpdate({ user: user._id, currentOrder: orderId }, { $set: { status: "available", currentOrder: null } });
  await recordAudit({ actor: user, action: "shipper.order_completed", targetType: "order", targetId: orderId });
  return result;
};

export const declineOrder = async (user, orderId, reason = "") => {
  const profile = await getProfile(user._id);
  requireApproved(profile);
  await recordAudit({ actor: user, action: "shipper.order_declined", targetType: "order", targetId: orderId, reason });
  return { success: true };
};

export const approveProfile = async (actor, userId, approvalStatus) => {
  const profile = await ShipperProfile.findOneAndUpdate(
    { user: userId },
    { $set: { approvalStatus, ...(approvalStatus === "rejected" && { status: "offline" }) } },
    { new: true }
  );
  if (!profile) throw new AppError("Shipper profile not found", 404);
  await recordAudit({
    actor,
    action: approvalStatus === "approved" ? "shipper.approved" : "shipper.rejected",
    targetType: "user",
    targetId: userId,
  });
  return { success: true, data: profile };
};

export const listProfiles = async () => ({
  success: true,
  data: await ShipperProfile.find({})
    .populate("user", "name email phone locked")
    .populate("currentOrder", "orderStatus totalPrice shippingAddress")
    .sort({ updatedAt: -1 }),
});

export const expireUnacceptedOrders = async () => {
  const now = new Date();
  const result = await Order.updateMany(
    {
      deliveryMethod: "shipper",
      shipperAssignmentStatus: "unassigned",
      orderStatus: "pending",
      shipperAssignmentDeadlineAt: { $lte: now },
    },
    {
      $set: {
        orderStatus: "cancelled",
        shipperAssignmentStatus: "expired",
        cancellationCode: "NO_SHIPPER_AVAILABLE",
        reason: "No shipper accepted this order within 15 minutes.",
      },
    }
  );
  return { cancelledCount: result.modifiedCount };
};

export { LOCATION_STALE_MS, OFFER_RADIUS_METRES };
