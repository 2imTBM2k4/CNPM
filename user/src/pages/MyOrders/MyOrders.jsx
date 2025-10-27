// import React, { useContext, useEffect, useState } from 'react'
// import './MyOrders.css'
// import { StoreContext } from '../../context/StoreContext';
// import axios from 'axios';
// import { assets } from '../../assets/assets';

// const MyOrders = () => {

//     const {url,token} = useContext(StoreContext);
//     const [data,setData] = useState([]);

//     const fetchOrders = async () => {
//         const response = await axios.post(url+"/api/order/userorders",{},{headers:{token}});
//         setData(response.data.data);
//     }

//     useEffect(()=>{
//         if (token) {
//             fetchOrders();
//         }
//     },[token])

//   return (
//     <div className='my-orders'>
//         <h2 className='myordersp'>My Orders</h2>
//         <div className="container">
//             {data.map((order,index)=>{
//                 return (
//                     <div key={index} className='my-orders-order'>
//                         <img src={assets.parcel_icon} alt="" />
//                         <p>{order.items.map((item,index)=>{
//                             if (index === order.items.length-1) {
//                                 return item.name+" x "+item.quantity
//                             }
//                             else{
//                                 return item.name+" x "+item.quantity+","
//                             }
//                         })}</p>
//                         <p>${order.amount}.00</p>
//                         <p>Items: {order.items.length}</p>
//                         <p><span>&#x25cf;</span> <b>{order.status}</b></p>
//                         <button onClick={fetchOrders}>Track Order</button>
//                     </div>
//                 )
//             })}
//         </div>
//     </div>
//   )
// }

// export default MyOrders

import React, { useState, useEffect, useContext } from 'react';
import './MyOrders.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';  // Thêm để redirect nếu !token

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);  // Default []
  const [loading, setLoading] = useState(true);  // Mới: Loading state
  const navigate = useNavigate();

  const fetchMyOrders = async () => {
    if (!token) {
      toast.error("Please login to view orders");
      navigate('/');  // Redirect nếu chưa login
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(url + "/api/order/userorders", { userId: 'dummy' }, { headers: { token } });  // userId không cần vì backend dùng req.user
      if (response.data.success) {
        setOrders(response.data.data || []);  // Fallback []
      } else {
        toast.error(response.data.message || "Error fetching orders");
        setOrders([]);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      toast.error("Network error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [token]);

  if (loading) {
    return <div>Loading orders...</div>;  // Spinner nếu cần
  }

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {orders?.map((order, index) => {  // Optional chaining + fallback
          return (
            <div key={index} className='my-orders-order'>
              <img src={assets.parcel_icon} alt="" />
              <p>{order.orderItems?.map((item, index) => {  // Cũng add ?
                if (index === order.orderItems.length - 1) {
                  return item.name + " x " + item.quantity;
                } else {
                  return item.name + " x " + item.quantity + ", ";
                }
              })}</p>
              <p>${order.totalPrice}</p>
              <p>Items: {order.orderItems?.length}</p>
              <p><span>&#x25cf;</span> <b>{order.orderStatus}</b></p>
              <button onClick={fetchMyOrders}>Track Order</button>
            </div>
          );
        }) || <p>No orders found</p>}  // Fallback UI
      </div>
    </div>
  );
};

export default MyOrders;