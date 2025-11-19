// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import "./Orders.css";
// import { assets } from "../../assets/assets";
// import io from "socket.io-client";

// const Orders = ({ url }) => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchAllOrders = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
//       const restaurantId = localStorage.getItem("restaurantId");
//       console.log(
//         "Fetch orders - Token exists:",
//         !!token,
//         "RestaurantId:",
//         restaurantId
//       );
//       const headers = token ? { token } : {};
//       const response = await axios.get(url + "/api/order/list", { headers });
//       console.log("Fetch orders response:", response.data);
//       if (response.data.success) {
//         // Normalize và sắp xếp order mới nhất lên đầu
//         const normalizedOrders = (response.data.data || [])
//           .map((order) => ({
//             ...order,
//             orderStatus: order.orderStatus?.toLowerCase() || "pending",
//           }))
//           .sort(
//             (a, b) =>
//               new Date(b.createdAt || b.orderDate) -
//               new Date(a.createdAt || a.orderDate)
//           ); // SẮP XẾP MỚI NHẤT LÊN ĐẦU

//         setOrders(normalizedOrders);
//         console.log(
//           "Sorted orders:",
//           normalizedOrders.map((o) => ({
//             id: o._id,
//             status: o.orderStatus,
//             date: o.createdAt || o.orderDate,
//           }))
//         );
//       } else {
//         toast.error(response.data.message || "Error fetching orders");
//         setOrders([]);
//       }
//     } catch (error) {
//       console.error("Fetch orders error:", error.response?.data || error);
//       toast.error(error.response?.data?.message || "Error fetching orders");
//       setOrders([]);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const updateStatus = async (orderId, status) => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         toast.error("Please login as restaurant owner");
//         return;
//       }

//       let reason = "";
//       if (status === "cancelled") {
//         reason = prompt("Enter cancellation reason:");
//         if (!reason || reason.trim() === "") {
//           toast.error("Reason is required for cancellation");
//           return;
//         }
//       }

//       // THỬ CÁC ENDPOINT KHÁC NHAU
//       let response;
//       try {
//         // Thử endpoint /status trước
//         response = await axios.post(
//           url + "/api/order/status",
//           {
//             orderId,
//             status,
//             reason,
//           },
//           { headers: { token } }
//         );
//       } catch (statusError) {
//         // Nếu /status không tồn tại, thử /update
//         console.log("Endpoint /status failed, trying /update");
//         response = await axios.post(
//           url + "/api/order/update",
//           {
//             orderId,
//             status,
//             reason,
//           },
//           { headers: { token } }
//         );
//       }

//       if (response.data.success) {
//         await fetchAllOrders();
//         toast.success("Status updated");
//       } else {
//         toast.error(response.data.message || "Error updating status");
//       }
//     } catch (error) {
//       console.error("Update status error:", error.response?.data || error);

//       // Hiển thị thông báo lỗi chi tiết hơn
//       if (error.response?.status === 404) {
//         toast.error(
//           "Update endpoint not found. Please check server configuration."
//         );
//       } else {
//         toast.error(error.response?.data?.message || "Error updating status");
//       }
//     }
//   };
//   useEffect(() => {
//     fetchAllOrders();

//     const socket = io(url);
//     const restaurantId = localStorage.getItem("restaurantId");
//     console.log("Socket join - RestaurantId:", restaurantId);
//     if (restaurantId) {
//       socket.emit("joinRestaurant", restaurantId);
//     } else {
//       console.warn("No restaurantId in localStorage - Socket join failed");
//       toast.warn("Please re-login to enable notifications");
//     }

//     socket.on("newOrder", (newOrder) => {
//       console.log("New order via socket:", newOrder);
//       toast.info("Có đơn hàng mới!");
//       // Normalize status và thêm vào đầu danh sách
//       newOrder.orderStatus = newOrder.orderStatus?.toLowerCase() || "pending";
//       setOrders((prev) => [newOrder, ...prev]); // THÊM MỚI VÀO ĐẦU DANH SÁCH
//     });

//     socket.on("connect_error", (error) => {
//       console.error("Socket connect error:", error);
//       toast.error("Notification connection failed");
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, [url]);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   const renderItems = (orderItems) => {
//     if (!orderItems || orderItems.length === 0) return "No items";
//     return orderItems
//       .map((item, idx) =>
//         idx === orderItems.length - 1
//           ? `${item.name} x ${item.quantity}`
//           : `${item.name} x ${item.quantity}, `
//       )
//       .join("");
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "pending":
//         return "#f39c12";
//       case "preparing":
//         return "#3498db";
//       case "delivering":
//         return "#9b59b6";
//       case "delivered":
//         return "#27ae60";
//       case "cancelled":
//         return "#e74c3c";
//       default:
//         return "#95a5a6";
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString("vi-VN", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   return (
//     <div className="order add">
//       <h3>Order Page</h3>
//       <div className="order-header-info">
//         <p>
//           Tổng số đơn hàng: <strong>{orders.length}</strong>
//         </p>
//         <p>Đơn hàng được sắp xếp mới nhất lên đầu</p>
//       </div>
//       <div className="order-list">
//         {orders.length === 0 ? (
//           <p>No orders (Check console for debug info)</p>
//         ) : (
//           orders.map((order, index) => (
//             <div key={order._id || index} className="order-item">
//               <div className="order-item-header">
//                 <img src={assets.parcel_icon} alt="" />
//                 <div className="order-meta">
//                   <span className="order-id">
//                     Order #{order._id?.slice(-8)?.toUpperCase()}
//                   </span>
//                   <span className="order-date">
//                     {formatDate(order.createdAt || order.orderDate)}
//                   </span>
//                 </div>
//                 <div
//                   className="order-status-badge"
//                   style={{ backgroundColor: getStatusColor(order.orderStatus) }}
//                 >
//                   {order.orderStatus}
//                 </div>
//               </div>

//               <div className="order-item-content">
//                 <div className="order-item-details">
//                   <p className="order-item-food">
//                     <strong>Items:</strong> {renderItems(order.orderItems)}
//                   </p>
//                   <p className="order-item-name">
//                     <strong>Customer:</strong>{" "}
//                     {order.shippingAddress?.fullName || "N/A"}
//                   </p>
//                   <div className="order-item-address">
//                     <p>
//                       <strong>Address:</strong>{" "}
//                       {order.shippingAddress?.address || ""},
//                     </p>
//                     <p>
//                       {order.shippingAddress?.city || ""},{" "}
//                       {order.shippingAddress?.state || ""},{" "}
//                       {order.shippingAddress?.country || ""},{" "}
//                       {order.shippingAddress?.zipCode || ""}
//                     </p>
//                   </div>
//                   <p className="order-item-phone">
//                     <strong>Phone:</strong>{" "}
//                     {order.shippingAddress?.phone || "N/A"}
//                   </p>
//                 </div>
//                 <div className="order-item-summary">
//                   <p>
//                     <strong>Items:</strong> {order.orderItems?.length || 0}
//                   </p>
//                   <p>
//                     <strong>Total:</strong> ${order.totalPrice || 0}
//                   </p>
//                   <p>
//                     <strong>Payment:</strong> {order.paymentMethod || "N/A"}
//                   </p>
//                 </div>
//               </div>

//               {order.orderStatus === "cancelled" && order.reason && (
//                 <p className="cancel-reason">
//                   <strong>Reason:</strong> {order.reason}
//                 </p>
//               )}

//               <div className="status-actions">
//                 {order.orderStatus === "pending" && (
//                   <div className="status-buttons">
//                     <button
//                       className="btn-accept"
//                       onClick={() => updateStatus(order._id, "preparing")}
//                     >
//                       Accept (Preparing)
//                     </button>
//                     <button
//                       className="btn-reject"
//                       onClick={() => updateStatus(order._id, "cancelled")}
//                     >
//                       Reject (Cancel)
//                     </button>
//                   </div>
//                 )}
//                 {order.orderStatus === "preparing" && (
//                   <div className="status-buttons">
//                     <button
//                       className="btn-deliver"
//                       onClick={() => updateStatus(order._id, "delivering")}
//                     >
//                       Handover to Shipper (Delivering)
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default Orders;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Orders.css";
import { assets } from "../../assets/assets";
import io from "socket.io-client";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const restaurantId = localStorage.getItem("restaurantId");
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
        toast.error(response.data.message || "Error fetching orders");
        setOrders([]);
      }
    } catch (error) {
      console.error("Fetch orders error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Error fetching orders");
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

  if (loading) {
    return <div>Loading...</div>;
  }

  const renderItems = (orderItems) => {
    if (!orderItems || orderItems.length === 0) return "No items";
    return orderItems
      .map((item, idx) =>
        idx === orderItems.length - 1
          ? `${item.name} x ${item.quantity}`
          : `${item.name} x ${item.quantity}, `
      )
      .join("");
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

  return (
    <div className="order add">
      <h3>Order Page</h3>
      <div className="order-header-info">
        <p>
          Tổng số đơn hàng: <strong>{orders.length}</strong>
        </p>
        <p>Đơn hàng được sắp xếp mới nhất lên đầu</p>
      </div>
      <div className="order-list">
        {orders.length === 0 ? (
          <p>No orders (Check console for debug info)</p>
        ) : (
          orders.map((order, index) => (
            <div key={order._id || index} className="order-item">
              <div className="order-item-header">
                <img src={assets.parcel_icon} alt="" />
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
                  <p className="order-item-food">
                    <strong>Items:</strong> {renderItems(order.orderItems)}
                  </p>
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
