import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Orders.css';
import { assets } from '../../assets/assets';
import io from 'socket.io-client';

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const restaurantId = localStorage.getItem('restaurantId');  // Thêm log
      console.log('Fetch orders - Token exists:', !!token, 'RestaurantId:', restaurantId);  // DEBUG
      const headers = token ? { token } : {};
      const response = await axios.get(url + "/api/order/list", { headers });
      console.log('Fetch orders response:', response.data);  // DEBUG: Check data
      if (response.data.success) {
        // Fallback: Convert status to lowercase nếu DB cũ
        const normalizedOrders = (response.data.data || []).map(order => ({
          ...order,
          orderStatus: order.orderStatus?.toLowerCase() || 'pending'
        }));
        setOrders(normalizedOrders);
        console.log('Normalized orders:', normalizedOrders.map(o => ({ id: o._id, status: o.orderStatus })));  // DEBUG
      } else {
        toast.error(response.data.message || "Error fetching orders");
        setOrders([]);
      }
    } catch (error) {
      console.error("Fetch orders error:", error.response?.data || error);  // DEBUG
      toast.error(error.response?.data?.message || "Error fetching orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login as restaurant owner");
        return;
      }

      let reason = '';
      if (status === 'cancelled') {
        reason = prompt("Enter cancellation reason:");
        if (!reason || reason.trim() === '') {
          toast.error("Reason is required for cancellation");
          return;
        }
      }

      const response = await axios.post(url + "/api/order/status", {
        orderId,
        status,
        reason
      }, { headers: { token } });

      if (response.data.success) {
        await fetchAllOrders();
        toast.success("Status updated");
      } else {
        toast.error(response.data.message || "Error updating status");
      }
    } catch (error) {
      console.error("Update status error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Error updating status");
    }
  };

  useEffect(() => {
    fetchAllOrders();

    const socket = io(url);
    const restaurantId = localStorage.getItem('restaurantId');
    console.log('Socket join - RestaurantId:', restaurantId);  // DEBUG
    if (restaurantId) {
      socket.emit('joinRestaurant', restaurantId);
    } else {
      console.warn('No restaurantId in localStorage - Socket join failed');  // DEBUG
      toast.warn('Please re-login to enable notifications');
    }

    socket.on('newOrder', (newOrder) => {
      console.log('New order via socket:', newOrder);  // DEBUG
      toast.info("Có đơn hàng mới!");
      // Normalize status cho newOrder
      newOrder.orderStatus = newOrder.orderStatus?.toLowerCase() || 'pending';
      setOrders((prev) => [newOrder, ...prev]);
    });

    socket.on('connect_error', (error) => {
      console.error("Socket connect error:", error);
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
    if (!orderItems || orderItems.length === 0) return 'No items';
    return orderItems.map((item, idx) => (
      idx === orderItems.length - 1 
        ? `${item.name} x ${item.quantity}` 
        : `${item.name} x ${item.quantity}, `
    )).join('');
  };

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.length === 0 ? (
          <p>No orders (Check console for debug info)</p>  // DEBUG: Clear message
        ) : (
          orders.map((order, index) => (
            <div key={order._id || index} className='order-item'>
              <img src={assets.parcel_icon} alt="" />
              <div>
                <p className='order-item-food'>
                  {renderItems(order.orderItems)}
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
              <p>Status: {order.orderStatus || 'pending'}</p>  {/* DEBUG: Show status */}
              {order.orderStatus === 'cancelled' && order.reason && (
                <p className="cancel-reason">Reason: {order.reason}</p>
              )}
              {order.orderStatus === 'pending' && (
                <div className="status-buttons">
                  <button onClick={() => updateStatus(order._id, 'preparing')}>Accept (Preparing)</button>
                  <button onClick={() => updateStatus(order._id, 'cancelled')}>Reject (Cancel)</button>
                </div>
              )}
              {order.orderStatus === 'preparing' && (
                <div className="status-buttons">
                  <button onClick={() => updateStatus(order._id, 'delivering')}>Handover to Shipper (Delivering)</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;