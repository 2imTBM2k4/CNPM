import React, { useState, useEffect, useContext } from 'react';
import './MyOrders.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
  const { url, token, setToken } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyOrders = async () => {
    if (!token) {
      console.log('No token on fetch, skipping...');
      return;
    }

    console.log('Fetching orders with token:', token.substring(0, 10) + '...');

    try {
      setLoading(true);
      const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
      console.log('Fetch orders response:', response.data);
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data.message || "Error fetching orders");
        setOrders([]);
      }
    } catch (error) {
      console.error("Fetch orders error:", error.response?.data || error);
      if (error.response?.status === 401) {
        console.log('Token invalid (401), clearing...');
        toast.error("Session expired. Please login again");
        localStorage.removeItem('token');
        setToken('');
        navigate('/');
      } else {
        toast.error("Network error. Please try again");
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    if (!token) {
      toast.error("Please login");
      return;
    }
    try {
      const response = await axios.post(url + "/api/order/status", { orderId, status }, { headers: { token } });
      if (response.data.success) {
        toast.success("Status updated");
        await fetchMyOrders();
      } else {
        toast.error(response.data.message || "Error updating status");
      }
    } catch (error) {
      console.error("Update status error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Error");
    }
  };

  useEffect(() => {
    console.log('MyOrders mounted, initial token:', !!token);
  }, []);

  useEffect(() => {
    if (token) {
      console.log('Token changed, fetching orders...');
      fetchMyOrders();
    }
  }, [token]);

  if (loading) {
    return <div className="loading">Loading orders...</div>;
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
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <div key={order._id || index} className='my-orders-order'>
              <img src={assets.parcel_icon} alt="" />
              <p>{renderItems(order.orderItems)}</p>
              <p>${order.totalPrice || 0}</p>
              <p>Items: {order.orderItems?.length || 0}</p>
              <p><span>&#x25cf;</span> <b>{order.orderStatus || 'pending'}</b></p>
              {order.orderStatus === 'cancelled' && order.reason && (
                <p className="cancel-reason">Reason: {order.reason}</p>
              )}
              <button onClick={fetchMyOrders}>Track Order</button>
              {order.orderStatus === 'delivering' && (  // Fix: Lowercase
                <button className="received-btn" onClick={() => updateStatus(order._id, 'delivered')}>Mark as Received</button>
              )}
            </div>
          ))
        ) : (
          <p>No orders found</p>
        )}
      </div>
    </div>
  );
};

export default MyOrders;