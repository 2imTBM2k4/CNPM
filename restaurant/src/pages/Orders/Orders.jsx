import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Orders.css";
import { assets } from "../../assets/assets";
import io from "socket.io-client";
import { EmptyState, ErrorState } from "../../../../shared/components/StateBlock";
import { ClipboardList } from "lucide-react";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const token = localStorage.getItem("token");
      const headers = token ? { token } : {};
      const response = await axios.get(url + "/api/order/list", { headers });
      if (response.data.success) {
        // Normalize và sắp xếp order mới nhất lên đầu
        const normalizedOrders = (response.data.data || [])
          .map((order) => ({
            ...order,
            orderStatus: order.orderStatus?.toLowerCase() || "pending",
          }))
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.orderDate) -
              new Date(a.createdAt || a.orderDate)
          ); // SẮP XẾP MỚI NHẤT LÊN ĐẦU

        setOrders(normalizedOrders);
      } else {
        throw new Error(response.data.message || "Error fetching orders");
      }
    } catch (error) {
      console.error("Fetch orders error:", error.response?.data || error);
      // Shown inline with a retry button instead of only as a toast the
      // owner may have missed.
      setLoadError(
        error.response?.data?.message || error.message || "Error fetching orders"
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  const updateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login as restaurant owner");
        return;
      }

      let reason = "";
      if (status === "cancelled") {
        reason = prompt("Enter cancellation reason:");
        if (!reason || reason.trim() === "") {
          toast.error("Reason is required for cancellation");
          return;
        }
      }

      // CHỈ GỌI /status - BỎ FALLBACK /update
      const response = await axios.post(
        url + "/api/order/status",
        {
          orderId,
          status,
          reason,
        },
        { headers: { token } }
      );

      if (response.data.success) {
        await fetchAllOrders();
        toast.success("Status updated");
      } else {
        toast.error(response.data.message || "Error updating status");
      }
    } catch (error) {
      console.error("Update status error:", error.response?.data || error);
      // Xử lý lỗi chi tiết hơn (không còn 404 fallback)
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error(
          error.response?.data?.message ||
            "Unauthorized - Check login/restaurant"
        );
      } else if (error.response?.status === 404) {
        toast.error("Endpoint not found - Check server routes");
      } else {
        toast.error(error.response?.data?.message || "Error updating status");
      }
    }
  };
  useEffect(() => {
    fetchAllOrders();

    const socket = io(url);
    const restaurantId = localStorage.getItem("restaurantId");
    if (restaurantId) {
      socket.emit("joinRestaurant", restaurantId);
    } else {
      toast.warn("Please re-login to enable notifications");
    }

    socket.on("newOrder", (newOrder) => {
      toast.info("Có đơn hàng mới!");
      // Normalize status và thêm vào đầu danh sách
      newOrder.orderStatus = newOrder.orderStatus?.toLowerCase() || "pending";
      setOrders((prev) => [newOrder, ...prev]); // THÊM MỚI VÀO ĐẦU DANH SÁCH
    });

    socket.on("connect_error", (error) => {
      toast.error("Notification connection failed");
    });

    return () => {
      socket.disconnect();
    };
  }, [url]);

  // The kitchen reads this, so each line spells out its options and note
  // rather than collapsing to a comma-separated string.
  const renderItems = (orderItems) => {
    if (!orderItems || orderItems.length === 0) return "No items";
    return (
      <ul className="order-line-list">
        {orderItems.map((item, idx) => (
          <li key={idx} className="order-line">
            <span className="order-line-main">
              {item.name} <span className="order-line-qty">x{item.quantity}</span>
            </span>
            {item.selectedOptions?.length > 0 && (
              <span className="order-line-options">
                {item.selectedOptions
                  .map((option) => `${option.groupName}: ${option.optionName}`)
                  .join(" · ")}
              </span>
            )}
            {item.note && (
              <span className="order-line-note">Note: {item.note}</span>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f39c12";
      case "preparing":
        return "#3498db";
      case "delivering":
        return "#9b59b6";
      case "delivered":
        return "#27ae60";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="order-page">
        <h1 className="page-title">Orders</h1>
        <div className="order-skeleton-list" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="order-skeleton-card">
              <div className="order-skeleton-head">
                <div className="skeleton skeleton-circle order-skeleton-icon" />
                <div className="order-skeleton-meta">
                  <div className="skeleton skeleton-text" style={{ width: 150 }} />
                  <div className="skeleton skeleton-text" style={{ width: 110 }} />
                </div>
                <div className="skeleton order-skeleton-badge" />
              </div>
              <div className="skeleton skeleton-text" style={{ width: "70%" }} />
              <div className="skeleton skeleton-text" style={{ width: "45%" }} />
              <div className="skeleton skeleton-text" style={{ width: "58%" }} />
              <div className="order-skeleton-actions">
                <div className="skeleton order-skeleton-btn" />
                <div className="skeleton order-skeleton-btn" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="order-page">
        <h1 className="page-title">Orders</h1>
        <ErrorState
          title="Could not load orders"
          description={loadError}
          onRetry={fetchAllOrders}
        />
      </div>
    );
  }

  return (
    <div className="order-page">
      <h1 className="page-title">Orders</h1>
      <div className="order-header-info">
        <p>
          Tổng số đơn hàng: <strong>{orders.length}</strong>
        </p>
        <p>Đơn hàng được sắp xếp mới nhất lên đầu</p>
      </div>
      <div className="order-list">
        {orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="New orders land here the moment a customer places one — this page updates live."
          />
        ) : (
          orders.map((order, index) => (
            <div key={order._id || index} className="order-item">
              <div className="order-item-header">
                <img src={assets.parcel_icon} alt="Order" />
                <div className="order-meta">
                  <span className="order-id">
                    Order #{order._id?.slice(-8)?.toUpperCase()}
                  </span>
                  <span className="order-date">
                    {formatDate(order.createdAt || order.orderDate)}
                  </span>
                </div>
                <div
                  className="order-status-badge"
                  style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                >
                  {order.orderStatus}
                </div>
              </div>

              <div className="order-item-content">
                <div className="order-item-details">
                  {/* div, not p — renderItems returns a list. */}
                  <div className="order-item-food">
                    <strong>Items:</strong> {renderItems(order.orderItems)}
                  </div>
                  <p className="order-item-name">
                    <strong>Customer:</strong>{" "}
                    {order.shippingAddress?.fullName || "N/A"}
                  </p>
                  <div className="order-item-address">
                    <p>
                      <strong>Address:</strong>{" "}
                      {order.shippingAddress?.address || ""},
                    </p>
                    <p>
                      {order.shippingAddress?.city || ""},{" "}
                      {order.shippingAddress?.state || ""},{" "}
                      {order.shippingAddress?.country || ""},{" "}
                      {order.shippingAddress?.zipCode || ""}
                    </p>
                  </div>
                  <p className="order-item-phone">
                    <strong>Phone:</strong>{" "}
                    {order.shippingAddress?.phone || "N/A"}
                  </p>
                </div>
                <div className="order-item-summary">
                  <p>
                    <strong>Items:</strong> {order.orderItems?.length || 0}
                  </p>
                  <p>
                    <strong>Total:</strong> ${order.totalPrice || 0}
                  </p>
                  <p>
                    <strong>Payment:</strong> {order.paymentMethod || "N/A"}
                  </p>
                </div>
              </div>

              {order.orderStatus === "cancelled" && order.reason && (
                <p className="cancel-reason">
                  <strong>Reason:</strong> {order.reason}
                </p>
              )}

              <div className="status-actions">
                {order.orderStatus === "pending" && (
                  <div className="status-buttons">
                    <button
                      className="btn-accept"
                      onClick={() => updateStatus(order._id, "preparing")}
                    >
                      Accept (Preparing)
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => updateStatus(order._id, "cancelled")}
                    >
                      Reject (Cancel)
                    </button>
                  </div>
                )}
                {order.orderStatus === "preparing" && (
                  <div className="status-buttons">
                    <button
                      className="btn-deliver"
                      onClick={() => updateStatus(order._id, "delivering")}
                    >
                      Handover to Shipper (Delivering)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
