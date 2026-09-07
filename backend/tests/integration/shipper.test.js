import { describe, expect, it } from "vitest";
import { Order, ShipperProfile } from "../../models/index.cjs";
import { createRestaurantOwner, createUser } from "../helpers.js";
import * as shipperService from "../../services/shipperService.js";

const point = (lng, lat) => ({ type: "Point", coordinates: [lng, lat] });

const makeShipper = async (suffix, coordinates = [106.7009, 10.7769]) => {
  const user = await createUser({ role: "shipper", email: `shipper-${suffix}@test.com` });
  await ShipperProfile.create({
    user: user._id,
    approvalStatus: "approved",
    status: "available",
    currentLocation: point(...coordinates),
    locationUpdatedAt: new Date(),
  });
  return user;
};

const makeOrder = async (userId, restaurantId, overrides = {}) =>
  Order.create({
    user: userId,
    restaurantId,
    orderItems: [{ product: restaurantId, name: "Food", quantity: 1, price: 50000 }],
    shippingAddress: { fullName: "Customer", address: "A", city: "HCM", state: "HCM", country: "VN", phone: "0900000000" },
    paymentMethod: "COD",
    itemsPrice: 50000,
    totalPrice: 55000,
    deliveryMethod: "shipper",
    pickupLocation: point(106.701, 10.777),
    shipperAssignmentStatus: "unassigned",
    shipperAssignmentDeadlineAt: new Date(Date.now() + 15 * 60 * 1000),
    ...overrides,
  });

describe("Shipper dispatch", () => {
  it("only exposes unassigned shipper orders within 3 km of the pickup", async () => {
    const { restaurant } = await createRestaurantOwner();
    const customer = await createUser({ email: "customer-near@test.com" });
    const shipper = await makeShipper("near");
    const near = await makeOrder(customer._id, restaurant._id);
    await makeOrder(customer._id, restaurant._id, { pickupLocation: point(106.77, 10.85) });

    const result = await shipperService.availableOrders(shipper._id);
    expect(result.data.map((order) => String(order._id))).toEqual([String(near._id)]);
  });

  it("atomically lets only one available shipper accept an order", async () => {
    const { restaurant } = await createRestaurantOwner();
    const customer = await createUser({ email: "customer-race@test.com" });
    const order = await makeOrder(customer._id, restaurant._id);
    const first = await makeShipper("first");
    const second = await makeShipper("second");

    const attempts = await Promise.allSettled([
      shipperService.acceptOrder(first, order._id),
      shipperService.acceptOrder(second, order._id),
    ]);
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);

    const claimed = await Order.findById(order._id);
    expect(claimed.shipperAssignmentStatus).toBe("accepted");
    expect([String(first._id), String(second._id)]).toContain(String(claimed.shipperId));
  });

  it("expires only overdue unassigned shipper orders", async () => {
    const { restaurant } = await createRestaurantOwner();
    const customer = await createUser({ email: "customer-expire@test.com" });
    const overdue = await makeOrder(customer._id, restaurant._id, {
      shipperAssignmentDeadlineAt: new Date(Date.now() - 1),
    });
    const active = await makeOrder(customer._id, restaurant._id);

    const result = await shipperService.expireUnacceptedOrders();
    expect(result.cancelledCount).toBe(1);
    expect((await Order.findById(overdue._id)).cancellationCode).toBe("NO_SHIPPER_AVAILABLE");
    expect((await Order.findById(active._id)).orderStatus).toBe("pending");
  });
});
