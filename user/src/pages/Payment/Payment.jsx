// import React, { useContext, useState } from 'react';
// import { StoreContext } from '../../context/StoreContext';
// import axios from 'axios';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import './Payment.css';  // Tạo nếu chưa: .payment { padding: 20px; max-width: 400px; margin: auto; }

// const Payment = () => {
//   const { url, token } = useContext(StoreContext);
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { orderData } = location.state || {};
//   const [paymentMethod, setPaymentMethod] = useState('COD');
//   const [loading, setLoading] = useState(false);

//   if (!orderData) {
//     return <p className="payment">Error: No order data. Go back to cart.</p>;
//   }

//   // Transform address to match schema: street → address, zipcode → zipCode, firstName + lastName → fullName
//   const transformAddress = (rawAddress) => ({
//     fullName: `${rawAddress.firstName} ${rawAddress.lastName}`.trim(),
//     address: rawAddress.street,  // Map street to address
//     city: rawAddress.city,
//     state: rawAddress.state,
//     country: rawAddress.country,
//     zipCode: rawAddress.zipcode,  // Map zipcode to zipCode (capital C)
//     phone: rawAddress.phone
//   });

//   const placeOrder = async () => {
//     if (!token) {
//       toast.error('Please login first');
//       navigate('/login');
//       return;
//     }

//     setLoading(true);
//     try {
//       // Transform address trước khi send
//       const transformedData = {
//         ...orderData,
//         address: transformAddress(orderData.address),
//         paymentMethod
//       };

//       console.log('Transformed order data:', transformedData);  // Debug: Check mapping

//       const response = await axios.post(`${url}/api/order/place`, transformedData, { headers: { token } });
//       if (response.data.success) {
//         if (paymentMethod === 'COD') {
//           toast.success('Order placed with COD! Check My Orders.');
//           navigate('/myorders');
//         } else {
//           // Giả lập PayPal: Delay 3s simulate payment success
//           setTimeout(async () => {
//             const verifyRes = await axios.post(`${url}/api/order/verify`, { 
//               orderId: response.data.orderId, 
//               success: 'true' 
//             }, { headers: { token } });
//             if (verifyRes.data.success) {
//               toast.success('PayPal payment successful! Check My Orders.');
//               navigate('/myorders');
//             } else {
//               toast.error('Payment verification failed');
//             }
//           }, 3000);
//         }
//       } else {
//         toast.error(response.data.message || 'Error placing order');
//       }
//     } catch (error) {
//       console.error('Place order error:', error.response?.data || error.message);  // Debug full error
//       toast.error(error.response?.data?.message || 'Server error. Check console.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="payment">
//       <h2>Choose Payment Method</h2>
//       <p>Total: ${orderData.amount}</p>
//       <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//         <option value="COD">Cash on Delivery (COD)</option>
//         <option value="PayPal">PayPal (Simulated)</option>
//       </select>
//       <button onClick={placeOrder} disabled={loading} className="confirm-btn">
//         {loading ? 'Processing...' : `Confirm ${paymentMethod} Payment`}
//       </button>
//     </div>
//   );
// };

// export default Payment;
import React, { useContext, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Payment.css';

const Payment = () => {
  const { url, token, clearCart } = useContext(StoreContext); // MỚI: Lấy clearCart từ context
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData } = location.state || {};
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  if (!orderData) {
    return <p className="payment">Error: No order data. Go back to cart.</p>;
  }

  // Transform address to match schema: street → address, zipcode → zipCode, firstName + lastName → fullName
  const transformAddress = (rawAddress) => ({
    fullName: `${rawAddress.firstName} ${rawAddress.lastName}`.trim(),
    address: rawAddress.street,  // Map street to address
    city: rawAddress.city,
    state: rawAddress.state,
    country: rawAddress.country,
    zipCode: rawAddress.zipcode,  // Map zipcode to zipCode (capital C)
    phone: rawAddress.phone
  });

  const placeOrder = async () => {
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Transform address trước khi send
      const transformedData = {
        ...orderData,
        address: transformAddress(orderData.address),
        paymentMethod
      };

      console.log('Transformed order data:', transformedData);  // Debug: Check mapping

      const response = await axios.post(`${url}/api/order/place`, transformedData, { headers: { token } });
      if (response.data.success) {
        // MỚI: Clear cart sau place order success (trước verify/payment flow)
        await clearCart();

        if (paymentMethod === 'COD') {
          toast.success('Order placed with COD! Check My Orders.');
          navigate('/myorders');
        } else {
          // Giả lập PayPal: Delay 3s simulate payment success
          setTimeout(async () => {
            const verifyRes = await axios.post(`${url}/api/order/verify`, { 
              orderId: response.data.orderId, 
              success: 'true' 
            }, { headers: { token } });
            if (verifyRes.data.success) {
              toast.success('PayPal payment successful! Check My Orders.');
              navigate('/myorders');
            } else {
              toast.error('Payment verification failed');
              // Nếu verify fail, cart đã clear rồi, nhưng có thể rollback nếu cần (không implement để đơn giản)
            }
          }, 3000);
        }
      } else {
        toast.error(response.data.message || 'Error placing order');
      }
    } catch (error) {
      console.error('Place order error:', error.response?.data || error.message);  // Debug full error
      toast.error(error.response?.data?.message || 'Server error. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment">
      <h2>Choose Payment Method</h2>
      <p>Total: ${orderData.amount}</p>
      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
        <option value="COD">Cash on Delivery (COD)</option>
        <option value="PayPal">PayPal (Simulated)</option>
      </select>
      <button onClick={placeOrder} disabled={loading} className="confirm-btn">
        {loading ? 'Processing...' : `Confirm ${paymentMethod} Payment`}
      </button>
    </div>
  );
};

export default Payment;