import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Orders.css";
import { assets } from "../../assets/assets";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [drones, setDrones] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDrone, setSelectedDrone] = useState("");

  const fetchAllOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }
    const response = await axios.get(url + "/api/order/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      setOrders(response.data.data);
    } else {
      toast.error("Error");
    }
  };

  const fetchDrones = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await axios.get(url + "/api/drone", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setDrones(response.data.data.filter(d => d.status === "available"));
      }
    } catch (error) {
      console.error("Error fetching drones:", error);
    }
  };

  const handleAssignDrone = async () => {
    if (!selectedDrone || !selectedOrder) {
      toast.error("Please select a drone");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        url + "/api/drone/assign",
        {
          orderId: selectedOrder._id,
          droneId: selectedDrone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Drone assigned successfully!");
        setShowAssignModal(false);
        setSelectedOrder(null);
        setSelectedDrone("");
        fetchAllOrders();
        fetchDrones();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error assigning drone");
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchDrones();
  }, []);

  return (
    <div className="order add">
      <h3>Order History (All)</h3>
      <div className="order-list">
        {orders.map((order, index) => (
          <div key={index} className="order-item">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className="order-item-food">
                {order.orderItems.map((item, idx) =>
                  idx === order.orderItems.length - 1
                    ? `${item.name} x ${item.quantity}`
                    : `${item.name} x ${item.quantity}, `
                )}
              </p>
              <p className="order-item-name">
                {order.shippingAddress.fullName}
              </p>
              {order.restaurantId && (
                <p className="order-item-restaurant">
                  Restaurant: {order.restaurantId.name}
                </p>
              )}
              <div className="order-item-address">
                <p>{order.shippingAddress.address},</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state},{" "}
                  {order.shippingAddress.country},{" "}
                  {order.shippingAddress.zipCode}
                </p>
              </div>
              <p className="order-item-phone">{order.shippingAddress.phone}</p>
              
              {order.droneId && (
                <p className="order-item-drone">
                  🚁 Drone: {order.droneId.droneCode || order.droneId}
                </p>
              )}
              {order.qrCode && (
                <p className="order-item-qr">
                  📱 QR: {order.qrCode}
                </p>
              )}
            </div>
            <p>Items: {order.orderItems.length}</p>
            <p>${order.totalPrice}</p>
            <p>Status: {order.orderStatus}</p>
            
            {order.orderStatus === "preparing" && !order.droneId && (
              <button
                className="assign-drone-btn"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowAssignModal(true);
                }}
              >
                🚁 Assign Drone
              </button>
            )}
          </div>
        ))}
      </div>

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Drone to Order</h3>
              <button className="btn-close" onClick={() => setShowAssignModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Order ID: {selectedOrder?._id}</p>
              <p>Customer: {selectedOrder?.shippingAddress?.fullName}</p>
              
              <div className="form-group">
                <label>Select Available Drone:</label>
                <select
                  value={selectedDrone}
                  onChange={(e) => setSelectedDrone(e.target.value)}
                >
                  <option value="">-- Select Drone --</option>
                  {drones.map((drone) => (
                    <option key={drone._id} value={drone._id}>
                      {drone.droneCode} (Battery: {drone.batteryLevel}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleAssignDrone}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
