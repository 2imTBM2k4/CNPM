import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Orders.css";
import { assets } from "../../assets/assets";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);

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

  useEffect(() => {
    fetchAllOrders();
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
              <div className="order-item-address">
                <p>{order.shippingAddress.address},</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state},{" "}
                  {order.shippingAddress.country},{" "}
                  {order.shippingAddress.zipCode}
                </p>
              </div>
              <p className="order-item-phone">{order.shippingAddress.phone}</p>
            </div>
            <p>Items: {order.orderItems.length}</p>
            <p>${order.totalPrice}</p>
            <p>Status: {order.orderStatus}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
