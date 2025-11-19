import React, { useEffect, useState } from "react";
import "./PlaceOrder.css";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    url,
    user,
    setUser,
  } = useContext(StoreContext);
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
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    let fillData = { ...data };
    if (token && user) {
      const fullName = user.name || "";
      const nameParts = fullName.split(" ");
      fillData.firstName = nameParts[0] || "";
      fillData.lastName = nameParts.slice(1).join(" ") || "";

      fillData.email = user.email || "";
      fillData.phone = user.phone || "";

      if (user.address) {
        fillData.street = user.address.street || "";
        fillData.city = user.address.city || "";
        fillData.state = user.address.state || "";
        fillData.country = user.address.country || "";
        fillData.zipcode = user.address.zipCode || "";
      }

      setData(fillData);
      return;
    }

    const savedDelivery = localStorage.getItem("deliveryInfo");
    if (savedDelivery) {
      try {
        const parsed = JSON.parse(savedDelivery);
        fillData = { ...fillData, ...parsed };
        setData(fillData);
      } catch (error) {
      }
    }
  }, [user, token]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const updateDeliveryToDB = async (deliveryData) => {
    if (!token || !user) return;

    try {
      setIsLoading(true);
      const updatePayload = {
        name: `${deliveryData.firstName} ${deliveryData.lastName}`.trim(),
        phone: deliveryData.phone,
        address: {
          street: deliveryData.street,
          city: deliveryData.city,
          state: deliveryData.state,
          zipCode: deliveryData.zipcode,
          country: deliveryData.country,
        },
      };

      const response = await fetch(`${url}/api/user/update-address`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();
      if (result.success) {
        setUser((prev) => ({ ...prev, ...updatePayload }));
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const idsInCart = Object.keys(cartItems).filter((id) => cartItems[id] > 0);

    let orderItems = [];
    const missingIds = [];
    idsInCart.forEach((id) => {
      const base = food_list.find((f) => f._id === id);
      if (base) {
        orderItems.push({ ...base, quantity: cartItems[id] });
      } else {
        missingIds.push(id);
      }
    });

    if (missingIds.length > 0) {
      try {
        const fetched = await Promise.all(
          missingIds.map(async (id) => {
            const res = await axios.get(`${url}/api/food/${id}`);
            if (res.data?.success && res.data?.data) {
              return { ...res.data.data, quantity: cartItems[id] };
            }
            return null;
          })
        );
        orderItems.push(...fetched.filter(Boolean));
      } catch (err) {
      }
    }

    if (orderItems.length === 0) {
      alert("Giỏ hàng trống hoặc dữ liệu món ăn chưa sẵn sàng!");
      return;
    }

    const orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + 2,
    };

    localStorage.setItem("deliveryInfo", JSON.stringify(data));
    await updateDeliveryToDB(data);
    navigate("/payment", { state: { orderData } });
  };

  useEffect(() => {
    if (!token) {
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [token, navigate, getTotalCartAmount]);

  if (isLoading) {
    return <div className="loading">Đang cập nhật thông tin...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="place-order">
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input
            required
            name="firstName"
            onChange={onChangeHandler}
            value={data.firstName}
            type="text"
            placeholder="First Name"
          />
          <input
            required
            name="lastName"
            onChange={onChangeHandler}
            value={data.lastName}
            type="text"
            placeholder="Last Name"
          />
        </div>
        <input
          className="emaill"
          required
          name="email"
          onChange={onChangeHandler}
          value={data.email}
          type="email"
          placeholder="Email address"
        />
        <input
          className="streett"
          required
          name="street"
          onChange={onChangeHandler}
          value={data.street}
          type="text"
          placeholder="Street"
        />
        <div className="multi-fields">
          <input
            required
            name="city"
            onChange={onChangeHandler}
            value={data.city}
            type="text"
            placeholder="City"
          />
          <input
            required
            name="state"
            onChange={onChangeHandler}
            value={data.state}
            type="text"
            placeholder="State"
          />
        </div>
        <div className="multi-fields">
          <input
            required
            name="zipcode"
            onChange={onChangeHandler}
            value={data.zipcode}
            type="text"
            placeholder="Zip code"
          />
          <input
            required
            name="country"
            onChange={onChangeHandler}
            value={data.country}
            type="text"
            placeholder="Country"
          />
        </div>
        <input
          className="phonee"
          required
          name="phone"
          onChange={onChangeHandler}
          value={data.phone}
          type="text"
          placeholder="Phone"
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
              <b>
                ${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}
              </b>
            </div>
          </div>
          <button type="submit" disabled={isLoading}>
            PROCEED TO PAYMENT
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
