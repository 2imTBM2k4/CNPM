// import React, { useEffect, useState } from 'react';
// import './PlaceOrder.css';
// import { useContext } from 'react';
// import { StoreContext } from '../../context/StoreContext';
// import { useNavigate } from 'react-router-dom';

// const PlaceOrder = () => {
//   const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);
//   const navigate = useNavigate();

//   const [data, setData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     street: "",
//     city: "",
//     state: "",
//     zipcode: "",
//     country: "",
//     phone: ""
//   });

//   const onChangeHandler = (event) => {
//     const name = event.target.name;
//     const value = event.target.value;
//     setData((prevData) => ({ ...prevData, [name]: value }));
//   };

//   const handleSubmit = async (event) => {  // Đổi tên thành handleSubmit, thêm async nếu cần gọi API sau
//     event.preventDefault();
//     console.log('Form submitted');  // Debug log
//     let orderItems = [];
//     food_list.forEach((item) => {
//       if (cartItems[item._id] > 0) {
//         let itemInfo = { ...item, quantity: cartItems[item._id] };
//         orderItems.push(itemInfo);
//       }
//     });
//     if (orderItems.length === 0) {
//       alert("Giỏ hàng trống!");
//       return;
//     }

//     const orderData = {
//       address: data,
//       items: orderItems,
//       amount: getTotalCartAmount() + 2,
//     };
//     console.log('Order data prepared:', orderData);  // Debug: Check data trước navigate
//     // Navigate to Payment with orderData in state
//     navigate('/payment', { state: { orderData } });
//   };

//   useEffect(() => {
//     if (!token) {
//       navigate('/cart');
//     } else if (getTotalCartAmount() === 0) {
//       navigate('/cart');
//     }
//   }, [token, navigate, getTotalCartAmount]);

//   return (
//     <form onSubmit={handleSubmit} className='place-order'>  {/* Fix: onSubmit={handleSubmit} */}
//       <div className="place-order-left">
//         <p className="title">Delivery Information</p>
//         <div className="multi-fields">
//           <input 
//             required 
//             name='firstName' 
//             onChange={onChangeHandler} 
//             value={data.firstName} 
//             type="text" 
//             placeholder='First Name' 
//           />
//           <input 
//             required 
//             name='lastName' 
//             onChange={onChangeHandler} 
//             value={data.lastName} 
//             type="text" 
//             placeholder='Last Name' 
//           />
//         </div>
//         <input 
//           className='emaill' 
//           required 
//           name='email' 
//           onChange={onChangeHandler} 
//           value={data.email} 
//           type="email" 
//           placeholder='Email address' 
//         />
//         <input 
//           className='streett' 
//           required 
//           name='street' 
//           onChange={onChangeHandler} 
//           value={data.street} 
//           type="text" 
//           placeholder='Street' 
//         />
//         <div className="multi-fields">
//           <input 
//             required 
//             name='city' 
//             onChange={onChangeHandler} 
//             value={data.city} 
//             type="text" 
//             placeholder='City' 
//           />
//           <input 
//             required 
//             name='state' 
//             onChange={onChangeHandler} 
//             value={data.state} 
//             type="text" 
//             placeholder='State' 
//           />
//         </div>
//         <div className="multi-fields">
//           <input 
//             required 
//             name='zipcode' 
//             onChange={onChangeHandler} 
//             value={data.zipcode} 
//             type="text" 
//             placeholder='Zip code' 
//           />
//           <input 
//             required 
//             name='country' 
//             onChange={onChangeHandler} 
//             value={data.country} 
//             type="text" 
//             placeholder='Country' 
//           />
//         </div>
//         <input 
//           className='phonee' 
//           required 
//           name='phone' 
//           onChange={onChangeHandler} 
//           value={data.phone} 
//           type="text" 
//           placeholder='Phone' 
//         />
//       </div>
//       <div className="place-order-right">
//         <div className="cart-total">
//           <h2>Cart Totals</h2>
//           <div>
//             <div className="cart-total-details">
//               <p>Subtotal</p>
//               <p>${getTotalCartAmount()}</p>
//             </div>
//             <hr />
//             <div className="cart-total-details">
//               <p>Delivery Fee</p>
//               <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
//             </div>
//             <hr />
//             <div className="cart-total-details">
//               <b>Total</b>
//               <b>${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
//             </div>
//           </div>
//           <button type='submit'>PROCEED TO PAYMENT</button>
//         </div>
//       </div>
//     </form>
//   );
// };

// export default PlaceOrder;

import React, { useEffect, useState } from 'react';
import './PlaceOrder.css';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url, user } = useContext(StoreContext);
  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false); // MỚI: Loading khi fetch/update

  // MỚI: Auto-fill từ user (DB) hoặc localStorage
  useEffect(() => {
    if (isLoading) return; // Tránh loop

    let fillData = { ...data }; // Clone để tránh mutate

    // Ưu tiên 1: Từ user DB (nếu có token và user.address/phone)
    if (token && user) {
      // Map user.name (full) → firstName/lastName (giả định split space đầu)
      const fullName = user.name || '';
      const nameParts = fullName.split(' ');
      fillData.firstName = nameParts[0] || '';
      fillData.lastName = nameParts.slice(1).join(' ') || '';

      fillData.email = user.email || '';
      fillData.phone = user.phone || '';

      // Map address object
      if (user.address) {
        fillData.street = user.address.street || '';
        fillData.city = user.address.city || '';
        fillData.state = user.address.state || '';
        fillData.country = user.address.country || '';
        fillData.zipcode = user.address.zipCode || ''; // Note: zipCode → zipcode
      }

      setData(fillData);
      console.log('Auto-filled from DB user:', fillData);
      return; // Đã fill từ DB, không cần localStorage
    }

    // Ưu tiên 2: Từ localStorage (nếu không có DB)
    const savedDelivery = localStorage.getItem('deliveryInfo');
    if (savedDelivery) {
      try {
        const parsed = JSON.parse(savedDelivery);
        fillData = { ...fillData, ...parsed };
        setData(fillData);
        console.log('Auto-filled from localStorage:', fillData);
      } catch (error) {
        console.error('Lỗi parse localStorage deliveryInfo:', error);
      }
    }
  }, [user, token]); // Re-run khi user hoặc token thay đổi

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  // MỚI: Update delivery info lên DB (protected API)
  const updateDeliveryToDB = async (deliveryData) => {
    if (!token || !user) return; // Không update nếu chưa login

    try {
      setIsLoading(true);
      // Map form data → user schema format
      const updatePayload = {
        name: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(), // Concat full name
        phone: deliveryData.phone,
        address: {
          street: deliveryData.street,
          city: deliveryData.city,
          state: deliveryData.state,
          zipCode: deliveryData.zipcode, // Note: zipcode → zipCode
          country: deliveryData.country
        }
      };

      const response = await fetch(`${url}/api/user/update-address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      const result = await response.json();
      if (result.success) {
        // Update local user state nếu success
        setUser(prev => ({ ...prev, ...updatePayload }));
        console.log('Updated delivery to DB success');
      } else {
        console.error('Update DB failed:', result.message);
        // Vẫn save localStorage, không block flow
      }
    } catch (error) {
      console.error('Lỗi update delivery to DB:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return; // Tránh double submit

    console.log('Form submitted');
    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = { ...item, quantity: cartItems[item._id] };
        orderItems.push(itemInfo);
      }
    });
    if (orderItems.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    const orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + 2,
    };
    console.log('Order data prepared:', orderData);

    // MỚI: Save to localStorage (fallback)
    localStorage.setItem('deliveryInfo', JSON.stringify(data));

    // MỚI: Update to DB nếu có token
    await updateDeliveryToDB(data);

    // Navigate to Payment
    navigate('/payment', { state: { orderData } });
  };

  useEffect(() => {
    if (!token) {
      navigate('/cart');
    } else if (getTotalCartAmount() === 0) {
      navigate('/cart');
    }
  }, [token, navigate, getTotalCartAmount]);

  if (isLoading) {
    return <div className="loading">Đang cập nhật thông tin...</div>; // Simple loading
  }

  return (
    <form onSubmit={handleSubmit} className='place-order'>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input 
            required 
            name='firstName' 
            onChange={onChangeHandler} 
            value={data.firstName} 
            type="text" 
            placeholder='First Name' 
          />
          <input 
            required 
            name='lastName' 
            onChange={onChangeHandler} 
            value={data.lastName} 
            type="text" 
            placeholder='Last Name' 
          />
        </div>
        <input 
          className='emaill' 
          required 
          name='email' 
          onChange={onChangeHandler} 
          value={data.email} 
          type="email" 
          placeholder='Email address' 
        />
        <input 
          className='streett' 
          required 
          name='street' 
          onChange={onChangeHandler} 
          value={data.street} 
          type="text" 
          placeholder='Street' 
        />
        <div className="multi-fields">
          <input 
            required 
            name='city' 
            onChange={onChangeHandler} 
            value={data.city} 
            type="text" 
            placeholder='City' 
          />
          <input 
            required 
            name='state' 
            onChange={onChangeHandler} 
            value={data.state} 
            type="text" 
            placeholder='State' 
          />
        </div>
        <div className="multi-fields">
          <input 
            required 
            name='zipcode' 
            onChange={onChangeHandler} 
            value={data.zipcode} 
            type="text" 
            placeholder='Zip code' 
          />
          <input 
            required 
            name='country' 
            onChange={onChangeHandler} 
            value={data.country} 
            type="text" 
            placeholder='Country' 
          />
        </div>
        <input 
          className='phonee' 
          required 
          name='phone' 
          onChange={onChangeHandler} 
          value={data.phone} 
          type="text" 
          placeholder='Phone' 
        />
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
            </div>
          </div>
          <button type='submit' disabled={isLoading}>PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;