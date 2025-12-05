import React, { useContext, useState, useEffect, useRef } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Payment.css";

const Payment = () => {
  const { url, token, clearCart, food_list, cartRestaurantId } = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData } = location.state || {};
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const paypalRef = useRef();

  useEffect(() => {
    const addPayPalScript = () => {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://www.paypal.com/sdk/js?client-id=AciP_05xSaGGzcHyWO3UCQ2kMlUMj_EsbBRgINfSc1nikIMx_-f7h1V0tmEXnnpHxcw7ZJ74GXWuBYrn&currency=USD`;
      script.async = true;
      script.onload = () => setSdkReady(true);
      document.body.appendChild(script);
    };

    if (!window.paypal) {
      addPayPalScript();
    } else {
      setSdkReady(true);
    }
  }, []);

  useEffect(() => {
    if (sdkReady && paymentMethod === "PayPal" && paypalRef.current && !paypalRef.current.hasChildNodes()) {
      window.paypal
        .Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: orderData.amount.toFixed(2),
                  },
                },
              ],
            });
          },
          onApprove: async (data, actions) => {
            const details = await actions.order.capture();
            handlePayPalSuccess(details);
          },
          onError: () => {
            toast.error("PayPal payment failed");
          },
        })
        .render(paypalRef.current);
    }
  }, [sdkReady, paymentMethod, orderData]);

  if (!orderData) {
    toast.error("No order data. Redirecting to cart...");
    navigate("/cart");
    return null;
  }

  const transformAddress = (rawAddress) => ({
    fullName: `${rawAddress.firstName} ${rawAddress.lastName}`.trim(),
    address: rawAddress.street,
    city: rawAddress.city,
    state: rawAddress.state,
    country: rawAddress.country,
    zipCode: rawAddress.zipcode,
    phone: rawAddress.phone,
  });

  const ensureRestaurantId = (items) => {
    return items.map((item) => {
      if (!item.restaurantId) {
        const food = food_list.find((f) => f._id === item._id);
        return { ...item, restaurantId: food?.restaurantId || null };
      }
      return item;
    });
  };

  const placeOrder = async (paymentDetails = null) => {
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    if (!cartRestaurantId) {
      toast.error("Restaurant ID not found. Please try again.");
      navigate("/cart");
      return;
    }

    setLoading(true);
    try {
      const itemsWithRestId = ensureRestaurantId(orderData.items);
      
      let restaurantIdString;
      if (!cartRestaurantId) {
        throw new Error("Restaurant ID not found");
      } else if (typeof cartRestaurantId === 'string') {
        restaurantIdString = cartRestaurantId;
      } else if (typeof cartRestaurantId === 'object') {
        restaurantIdString = cartRestaurantId._id || (cartRestaurantId.toString && cartRestaurantId.toString() !== '[object Object]' ? cartRestaurantId.toString() : null);
      }

      if (!restaurantIdString || restaurantIdString === '[object Object]') {
        throw new Error("Invalid restaurant ID format");
      }

      const transformedData = {
        ...orderData,
        items: itemsWithRestId,
        address: transformAddress(orderData.address),
        paymentMethod,
        restaurantId: restaurantIdString,
        ...(paymentDetails && { paymentDetails }),
      };

      const response = await axios.post(
        `${url}/api/order/place`,
        transformedData,
        { headers: { token } }
      );

      if (response.data.success) {
        await clearCart();
        toast.success("Order placed successfully!");
        navigate("/myorders");
      } else {
        toast.error(response.data.message || "Error placing order");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Server error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalSuccess = async (details) => {
    await placeOrder({
      paypalOrderId: details.id,
      paypalPayerId: details.payer.payer_id,
      paypalStatus: details.status,
    });
  };

  return (
    <div className="payment">
      <h2>Choose Payment Method</h2>
      <p>Total: ${orderData.amount}</p>
      
      <div className="payment-methods">
        <label className="payment-option">
          <input
            type="radio"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span>Cash on Delivery (COD)</span>
        </label>
        
        <label className="payment-option">
          <input
            type="radio"
            value="PayPal"
            checked={paymentMethod === "PayPal"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span>PayPal / Credit or Debit Card</span>
        </label>
      </div>

      {paymentMethod === "COD" && (
        <button onClick={() => placeOrder()} disabled={loading} className="confirm-btn">
          {loading ? "Processing..." : "Confirm Order"}
        </button>
      )}

      {paymentMethod === "PayPal" && (
        <div className="paypal-container">
          {!sdkReady ? (
            <div>Loading PayPal...</div>
          ) : (
            <div ref={paypalRef}></div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;
