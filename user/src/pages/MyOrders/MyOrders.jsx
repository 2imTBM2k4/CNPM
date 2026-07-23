import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import DroneDelivery from "../../components/DroneDelivery/DroneDelivery";
import "./MyOrders.css"; // Giả sử bạn có file CSS này cho style nhất quán với light mode

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDroneModal, setShowDroneModal] = useState(false);
  const [canReceiveOrder, setCanReceiveOrder] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${url}/api/order/userorders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      toast.error("Failed to load orders");
    }
  };

  const confirmReceived = async (orderId) => {
    try {
      const payload = {
        orderId,
        status: "delivered",
        isPaid: true,
        paidAt: new Date().toISOString(),
      };

      const response = await axios.post(`${url}/api/order/status`, payload, {
        // Sửa route thành /status
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success("Delivery confirmed!");
        fetchOrders();
        setShowDroneModal(false);
        setSelectedOrder(null);
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleViewDelivery = (order) => {
    if (order.orderStatus === "delivering") {
      setSelectedOrder(order);
      setShowDroneModal(true);
    }
  };

  const handleDeliveryComplete = () => {
    if (selectedOrder) {
      setCanReceiveOrder((prev) => ({
        ...prev,
        [selectedOrder._id]: true,
      }));
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }
    try {
      const response = await axios.post(
        `${url}/api/order/status`,
        { orderId: showCancelModal, status: "cancelled", reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Order cancelled");
        setShowCancelModal(null);
        setCancelReason("");
        fetchOrders();
      } else {
        toast.error(response.data.message || "Cancellation failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Cancellation failed");
    }
  };

  // Hàm helper để format date (giữ nguyên từ code cũ)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Hàm helper cho status text và color (giữ nguyên)
  const getStatusText = (status) => {
    const statusMap = {
      pending: "Pending",
      preparing: "Preparing",
      delivering: "Delivering",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "#ffc107",
      preparing: "#17a2b8",
      delivering: "#007bff",
      delivered: "#28a745",
      cancelled: "#dc3545",
    };
    return colorMap[status] || "#6c757d";
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p className="no-orders">No orders yet</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h4>Order #{order._id.slice(-8).toUpperCase()}</h4>
                  <span className="order-date">
                    {formatDate(order.createdAt || order.orderDate)}
                  </span>
                </div>
                <div
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                >
                  {getStatusText(order.orderStatus)}
                </div>
              </div>

              <div className="order-details">
                <div className="order-items">
                  <strong>Items:</strong>
                  <div className="items-list">
                    {order.orderItems?.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-price">${item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="order-summary">
                  <div className="summary-row">
                    <span>Total:</span>
                    <strong>${order.totalPrice}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Payment method:</span>
                    <span>
                      {order.paymentMethod === "COD"
                        ? "Cash on delivery"
                        : "Credit card"}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery address:</span>
                    <span>
                      {order.shippingAddress?.address},{" "}
                      {order.shippingAddress?.city}
                    </span>
                  </div>
                </div>
              </div>

              {order.orderStatus === "pending" && (
                <div className="order-actions">
                  <button
                    onClick={() => setShowCancelModal(order._id)}
                    className="cancel-order-btn"
                  >
                    Cancel order
                  </button>
                </div>
              )}

              {order.orderStatus === "delivering" && (
                <div className="order-actions">
                  <button
                    onClick={() => handleViewDelivery(order)}
                    className="view-delivery-btn"
                  >
                    View delivery details
                  </button>
                  <button
                    onClick={() => confirmReceived(order._id)}
                    className={`confirm-received-btn ${
                      canReceiveOrder[order._id] ? "enabled" : "disabled"
                    }`}
                    disabled={!canReceiveOrder[order._id]}
                  >
                    Confirm received
                  </button>
                </div>
              )}

              {order.orderStatus === "cancelled" && order.reason && (
                <div className="cancel-reason">
                  <strong>Cancellation reason:</strong> {order.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div
          className="drone-modal-overlay"
          onClick={() => {
            setShowCancelModal(null);
            setCancelReason("");
          }}
        >
          <div
            className="cancel-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Cancel order</h3>
            <p>Please provide a reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={3}
              className="cancel-reason-input"
            />
            <div className="cancel-modal-actions">
              <button
                onClick={() => {
                  setShowCancelModal(null);
                  setCancelReason("");
                }}
                className="cancel-modal-back-btn"
              >
                Go back
              </button>
              <button
                onClick={handleCancelOrder}
                className="cancel-modal-confirm-btn"
                disabled={!cancelReason.trim()}
              >
                Confirm cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drone Delivery Modal */}
      {showDroneModal && selectedOrder && (
        <div
          className="drone-modal-overlay"
          onClick={() => setShowDroneModal(false)}
        >
          <div
            className="drone-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="drone-modal-close"
              onClick={() => setShowDroneModal(false)}
            >
              ✕
            </button>
            <DroneDelivery
              order={selectedOrder}
              onDeliveryComplete={handleDeliveryComplete}
            />
            {canReceiveOrder[selectedOrder._id] && (
              <div className="drone-modal-actions">
                <button
                  onClick={() => confirmReceived(selectedOrder._id)}
                  className="confirm-received-btn enabled"
                >
                  Confirm received
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
