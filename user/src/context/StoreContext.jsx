import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const url = import.meta.env.VITE_API_URL;
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [restaurant_list, setRestaurantList] = useState([]);
  const [cartRestaurantId, setCartRestaurantId] = useState(null);
  const [isLoadingFoods, setIsLoadingFoods] = useState(true);

  const getRestaurantId = (item) => {
    if (!item.restaurantId) return null;
    
    if (typeof item.restaurantId === 'string') {
      return item.restaurantId;
    }
    
    if (typeof item.restaurantId === 'object') {
      return item.restaurantId._id || null;
    }
    
    return null;
  };
  const fetchFoodList = async () => {
    try {
      setIsLoadingFoods(true);
      const res = await axios.get(`${url}/api/food/list`);
      if (res.data.success) {
        setFoodList(res.data.data || []);
      } else {
        throw new Error(res.data.message || "Failed to load foods");
      }
    } catch (err) {
      setFoodList([]);
    } finally {
      setIsLoadingFoods(false);
    }
  };

  const fetchRestaurantList = async () => {
    try {
      const res = await axios.get(`${url}/api/restaurant/list`);
      if (res.data.success) {
        setRestaurantList(res.data.data || []);
      }
    } catch (err) {
      console.error("Fetch restaurant error:", err);
    }
  };

  const fetchSingleFood = async (itemId) => {
    try {
      const res = await axios.get(`${url}/api/food/${itemId}`);
      if (res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || "Food not found");
      }
    } catch (err) {
      throw err;
    }
  };

  const loadCartData = async (token) => {
    try {
      const res = await axios.get(`${url}/api/cart/get`, {
        headers: { token },
      });
      if (res.data.success) {
        const cartData = res.data.cartData || {};
        setCartItems(cartData);

        const firstId = Object.keys(cartData)[0];
        if (firstId && food_list.length > 0) {
          const item = food_list.find((p) => p._id === firstId);
          if (item) setCartRestaurantId(getRestaurantId(item));
        } else {
          setCartRestaurantId(null);
        }
      } else {
        setCartItems({});
        setCartRestaurantId(null);
      }
    } catch (err) {
      console.error("Load cart error:", err);
      setCartItems({});
      setCartRestaurantId(null);
    }
  };

  const fetchUserInfo = async (token) => {
    try {
      const res = await axios.get(`${url}/api/user/me`, { headers: { token } });
      if (res.data.success) setUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = async (itemId, quantity = 1) => {
    if (!token) {
      alert("Vui lòng đăng nhập!");
      setShowLogin(true);
      return false;
    }

    if (isLoadingFoods) {
      alert("Đang tải dữ liệu, vui lòng thử lại!");
      return false;
    }

    let item = food_list.find((p) => p._id === itemId);
    if (!item) {
      try {
        item = await fetchSingleFood(itemId);
      } catch (err) {
        alert("Sản phẩm không tồn tại!");
        return false;
      }
    }

    const itemRestaurantId = getRestaurantId(item);

    if (cartRestaurantId && cartRestaurantId !== itemRestaurantId) {
      alert("Chỉ được đặt từ 1 nhà hàng!");
      return false;
    }

    try {
      for (let i = 0; i < quantity; i++) {
        const res = await axios.post(
          `${url}/api/cart/add`,
          { itemId },
          { headers: { token } }
        );
        if (!res.data.success) throw new Error("Add failed");
      }
      await loadCartData(token);
      if (!cartRestaurantId) setCartRestaurantId(itemRestaurantId);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "";
      const isSingleRestaurantViolation =
        err?.response?.status === 400 ||
        msg.includes("một nhà hàng") ||
        msg.toLowerCase().includes("one restaurant");

      if (isSingleRestaurantViolation) {
        alert("Chỉ có thể thêm món từ 1 nhà hàng");
      } else {
        alert("Lỗi thêm vào giỏ hàng: " + msg);
      }
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    if (!token) return;
    try {
      const res = await axios.post(
        `${url}/api/cart/remove`,
        { itemId },
        { headers: { token } }
      );
      if (!res.data.success) throw new Error("Remove failed");
      await loadCartData(token);
    } catch (err) {
      console.error("Remove from cart error:", err);
    }
  };

  const removeItemFromCart = async (itemId) => {
    if (!token) return;
    const qty = cartItems[itemId] || 0;
    try {
      for (let i = 0; i < qty; i++) {
        const res = await axios.post(
          `${url}/api/cart/remove`,
          { itemId },
          { headers: { token } }
        );
        if (!res.data.success) throw new Error("Remove failed");
      }
      await loadCartData(token);
    } catch (err) {
      console.error("Remove item error:", err);
    }
  };

  const clearCart = async () => {
    if (!token) {
      setCartItems({});
      setCartRestaurantId(null);
      return;
    }
    try {
      const res = await axios.post(
        `${url}/api/cart/clear`,
        {},
        { headers: { token } }
      );
      if (res.data.success) {
        setCartItems({});
        setCartRestaurantId(null);
      }
    } catch (err) {
      console.error("Clear cart error:", err);
    }
  };

  const getTotalCartAmount = () => {
    let total = 0;
    for (const id in cartItems) {
      if (cartItems[id] > 0) {
        const item = food_list.find((p) => p._id === id) || { price: 10 };
        total += item.price * cartItems[id];
      }
    }
    return total;
  };
  useEffect(() => {
    async function init() {
      await fetchFoodList();
      await fetchRestaurantList();
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        await fetchUserInfo(savedToken);
        await loadCartData(savedToken);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (token && food_list.length > 0 && Object.keys(cartItems).length > 0) {
      const firstId = Object.keys(cartItems)[0];
      const item = food_list.find((p) => p._id === firstId);
      if (item && !cartRestaurantId) {
        const restId = getRestaurantId(item);
        setCartRestaurantId(restId);
      }
    }
  }, [food_list, cartItems, token]);

  useEffect(() => {
    if (token) {
      loadCartData(token);
    } else {
      setCartItems({});
      setCartRestaurantId(null);
      localStorage.removeItem("cartItems");
      localStorage.removeItem("cartRestaurantId");
    }
  }, [token]);

  const contextValue = {
    food_list,
    restaurant_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    removeItemFromCart,
    clearCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
    showLogin,
    setShowLogin,
    cartRestaurantId,
    user,
    setUser,
    isLoadingFoods,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
