import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Orders.css';
import { assets } from '../../assets/assets';
import io from 'socket.io-client';

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);  // Mới

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(url + "/api/order/list");
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data.message || "Error");
        setOrders([]);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      toast.error("Error fetching orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(url + "/api/order/status", {
        orderId,
        status: event.target.value
      });
      if (response.data.success) {
        await fetchAllOrders();
      } else {
        toast.error("Error updating status");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Error");
    }
  };

  useEffect(() => {
    fetchAllOrders();

    const socket = io(url);
    const restaurantId = localStorage.getItem('restaurantId');  // Assume lưu từ login
    if (restaurantId) {
      socket.emit('joinRestaurant', restaurantId);
    }

    socket.on('newOrder', (newOrder) => {
      toast.info("Có đơn hàng mới!");
      setOrders((prev) => [newOrder, ...prev]);
    });

    socket.on('connect_error', (error) => {
      console.error("Socket connect error:", error);
      toast.error("Notification connection failed");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders?.map((order, index) => (
          <div key={index} className='order-item'>
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className='order-item-food'>
                {order.orderItems?.map((item, idx) => (
                  idx === order.orderItems.length - 1 ? `${item.name} x ${item.quantity}` : `${item.name} x ${item.quantity}, `
                )) || 'No items'}
              </p>
              <p className='order-item-name'>{order.shippingAddress?.fullName || 'N/A'}</p>
              <div className="order-item-address">
                <p>{order.shippingAddress?.address || ''},</p>
                <p>{order.shippingAddress?.city || ''}, {order.shippingAddress?.state || ''}, {order.shippingAddress?.country || ''}, {order.shippingAddress?.zipCode || ''}</p>
              </div>
              <p className="order-item-phone">{order.shippingAddress?.phone || 'N/A'}</p>
            </div>
            <p>Items: {order.orderItems?.length || 0}</p>
            <p>${order.totalPrice || 0}</p>
            <select onChange={(event) => statusHandler(event, order._id)} value={order.orderStatus || 'Pending'}>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        )) || <p>No orders</p>}
      </div>
    </div>
  );
};

export default Orders;