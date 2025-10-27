// import React, { useEffect, useState } from 'react'
// import './Orders.css'
// import {toast} from "react-toastify"
// import axios from "axios"
// import {assets} from "../../assets/assets"

// const Orders = ({url}) => {

//   const [orders,setOrders] = useState([]);

//   const fetchAllOrders = async () => {
//     const response = await axios.get(url+"/api/order/list");
//     if (response.data.success){
//       setOrders(response.data.data);
//       console.log(response.data.data);
//     }
//     else{
//       toast.error("Error")
//     }
//   }

//   const statusHandler = async (event,orderId) => {
//     const response = await axios.post(url+"/api/order/status",{
//       orderId,
//       status:event.target.value
//     })
//     if (response.data.success){
//       await fetchAllOrders();
//     }
//   }


// useEffect(()=>{
//   fetchAllOrders();
// },[])

//   return (
//     <div className='order add'>
//       <h3>Order Page</h3>
//       <div className="order-list">
//         {orders.map((order,index)=>(
//           <div key={index} className='order-item'>
//             <img src={assets.parcel_icon} alt="" />
//             <div>
//               <p className='order-item-food'>
//                 {order.items.map((item,index)=>{
//                   if (index===order.items.length-1){
//                     return item.name + " x " + item.quantity
//                   }
//                   else{
//                     return item.name + " x " + item.quantity + ", "
//                   }
//                 })}
//               </p>
//               <p className='order-item-name'>{order.address.firstName+" "+order.address.lastName}</p>
//               <div className="order-item-address">
//                 <p>{order.address.street+","}</p>
//                 <p>{order.address.city+", "+order.address.state+", "+order.address.country+", "+order.address.zipcode}</p>
//               </div>
//               <p className="order-item-phone">{order.address.phone}</p>
//             </div>
//             <p>Items : {order.items.length}</p>
//             <p>${order.amount}</p>
//             <select onChange={(event)=>statusHandler(event,order._id)} value={order.status}>
//               <option value="Food Processing">Food Processing</option>
//               <option value="Out for delivery">Out for delivery</option>
//               <option value="Delivered">Delivered</option>
//             </select>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// export default Orders
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Orders.css';
import { assets } from '../../assets/assets';
import io from 'socket.io-client';  // Mới: Import socket.io-client

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    const response = await axios.get(url + "/api/order/list");
    if (response.data.success) {
      setOrders(response.data.data);
    } else {
      toast.error("Error");
    }
  };

  const statusHandler = async (event, orderId) => {
    const response = await axios.post(url + "/api/order/status", {
      orderId,
      status: event.target.value
    });
    if (response.data.success) {
      await fetchAllOrders();
    }
  };

  useEffect(() => {
    fetchAllOrders();

    // Mới: Setup socket
    const socket = io(url);  // Kết nối đến backend URL
    // Join room với restaurantId (assume lấy từ localStorage hoặc API user)
    const restaurantId = localStorage.getItem('restaurantId');  // Assume lưu khi login
    if (restaurantId) {
      socket.emit('joinRestaurant', restaurantId);
    }

    socket.on('newOrder', (newOrder) => {
      toast.info("Có đơn hàng mới!");  // Notification popup
      setOrders((prev) => [newOrder, ...prev]);  // Thêm vào list realtime
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order, index) => (
          <div key={index} className='order-item'>
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className='order-item-food'>
                {order.orderItems.map((item, idx) => (
                  idx === order.orderItems.length - 1 ? `${item.name} x ${item.quantity}` : `${item.name} x ${item.quantity}, `
                ))}
              </p>
              <p className='order-item-name'>{order.shippingAddress.fullName}</p>
              <div className="order-item-address">
                <p>{order.shippingAddress.address},</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.country}, {order.shippingAddress.zipCode}</p>
              </div>
              <p className="order-item-phone">{order.shippingAddress.phone}</p>
            </div>
            <p>Items: {order.orderItems.length}</p>
            <p>${order.totalPrice}</p>
            <select onChange={(event) => statusHandler(event, order._id)} value={order.orderStatus}>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;