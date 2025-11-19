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
      toast.error("Không thể tải đơn hàng");
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
        toast.success("Đã xác nhận nhận hàng!");
        fetchOrders();
        setShowDroneModal(false);
        setSelectedOrder(null);
      } else {
        toast.error(response.data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      toast.error("Cập nhật thất bại");
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

  // Hàm helper để format date (giữ nguyên từ code cũ)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
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
      pending: "Chờ xác nhận",
      preparing: "Đang chuẩn bị",
      delivering: "Đang giao hàng",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
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
      <h2>Đơn hàng của tôi</h2>
      {orders.length === 0 ? (
        <p className="no-orders">Chưa có đơn hàng nào</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h4>Đơn hàng #{order._id.slice(-8).toUpperCase()}</h4>
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
                  <strong>Sản phẩm:</strong>
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
                    <span>Tổng tiền:</span>
                    <strong>${order.totalPrice}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Phương thức thanh toán:</span>
                    <span>
                      {order.paymentMethod === "COD"
                        ? "Thanh toán khi nhận hàng"
                        : "Thẻ tín dụng"}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Địa chỉ giao hàng:</span>
                    <span>
                      {order.shippingAddress?.address},{" "}
                      {order.shippingAddress?.city}
                    </span>
                  </div>
                </div>
              </div>

              {order.orderStatus === "delivering" && (
                <div className="order-actions">
                  <button
                    onClick={() => handleViewDelivery(order)}
                    className="view-delivery-btn"
                  >
                    🚁 Xem chi tiết giao hàng
                  </button>
                  <button
                    onClick={() => confirmReceived(order._id)}
                    className={`confirm-received-btn ${
                      canReceiveOrder[order._id] ? "enabled" : "disabled"
                    }`}
                    disabled={!canReceiveOrder[order._id]}
                  >
                    ✅ Xác nhận đã nhận hàng
                  </button>
                </div>
              )}

              {order.orderStatus === "cancelled" && order.reason && (
                <div className="cancel-reason">
                  <strong>Lý do hủy:</strong> {order.reason}
                </div>
              )}
            </div>
          ))}
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
                  ✅ Xác nhận đã nhận hàng
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
