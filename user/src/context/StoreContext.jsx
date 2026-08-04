import axios from "axios";
import { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  // The cart is a list of LINES, not a map of foodId -> quantity: the same
  // dish with different options is two lines. Each line is
  // { lineKey, foodId, name, image, basePrice, unitPrice, quantity,
  //   selectedOptions, note, restaurantId } and comes priced by the server.
  const [cartLines, setCartLines] = useState([]);
  const [cartRestaurantId, setCartRestaurantId] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const url = import.meta.env.VITE_API_URL;
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [restaurant_list, setRestaurantList] = useState([]);
  const [isLoadingFoods, setIsLoadingFoods] = useState(true);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [restaurantError, setRestaurantError] = useState(null);
  const [fees, setFees] = useState({ deliveryFee: 0, serviceFee: 0 });
  // False until the saved token has been read AND the cart fetched. Guards
  // that redirect on "no token" or "empty cart" must wait for this, or a
  // direct hit on /checkout bounces before the session is restored.
  const [isHydrated, setIsHydrated] = useState(false);

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
      setIsLoadingRestaurants(true);
      setRestaurantError(null);
      const res = await axios.get(`${url}/api/restaurant/list`);
      if (res.data.success) {
        setRestaurantList(res.data.data || []);
      } else {
        throw new Error(res.data.message || "Failed to load restaurants");
      }
    } catch (err) {
      console.error("Fetch restaurant error:", err);
      setRestaurantError(err.message || "Failed to load restaurants");
    } finally {
      setIsLoadingRestaurants(false);
    }
  };

  // Delivery and service fees come from the server so the figures shown at
  // checkout match the ones the server charges.
  const fetchFees = async () => {
    try {
      const res = await axios.get(`${url}/api/config/fees`);
      if (res.data.success) {
        setFees({
          deliveryFee: res.data.deliveryFee ?? 0,
          serviceFee: res.data.serviceFee ?? 0,
        });
      }
    } catch (err) {
      console.error("Fetch fees error:", err);
    }
  };

  const fetchSingleFood = async (itemId) => {
    const res = await axios.get(`${url}/api/food/${itemId}`);
    if (res.data.success) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Food not found");
  };

  /** Every cart endpoint returns the whole cart; this is the single sink. */
  const applyCartResponse = (data) => {
    setCartLines(data?.items || []);
    setCartRestaurantId(data?.restaurantId || null);
  };

  const clearLocalCart = () => {
    setCartLines([]);
    setCartRestaurantId(null);
  };

  const loadCartData = async (authToken) => {
    try {
      const res = await axios.get(`${url}/api/cart/get`, {
        headers: { token: authToken },
      });
      if (res.data.success) {
        applyCartResponse(res.data);
      } else {
        clearLocalCart();
      }
    } catch (err) {
      console.error("Load cart error:", err);
      clearLocalCart();
    }
  };

  const fetchUserInfo = async (authToken) => {
    try {
      const res = await axios.get(`${url}/api/user/me`, {
        headers: { token: authToken },
      });
      if (res.data.success) setUser(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Add a dish, optionally with option picks and a kitchen note. The server
   * validates the picks against the dish and prices them, then returns the
   * updated cart.
   */
  const addToCart = async (
    itemId,
    quantity = 1,
    selectedOptions = [],
    note = ""
  ) => {
    if (!token) {
      toast.warning("Please sign in to continue!");
      setShowLogin(true);
      return false;
    }

    try {
      const res = await axios.post(
        `${url}/api/cart/add`,
        { itemId, quantity, selectedOptions, note },
        { headers: { token } }
      );
      if (!res.data.success) throw new Error(res.data.message || "Add failed");
      applyCartResponse(res.data);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "";
      if (msg.toLowerCase().includes("one restaurant")) {
        toast.warning("You can only add items from one restaurant!");
      } else {
        toast.error(msg || "Failed to add to cart");
      }
      return false;
    }
  };

  /** Set a line's quantity outright. Quantity 0 removes it. */
  const updateLine = async (lineKey, quantity) => {
    if (!token) return false;
    try {
      const res = await axios.post(
        `${url}/api/cart/update-line`,
        { lineKey, quantity },
        { headers: { token } }
      );
      if (!res.data.success) throw new Error(res.data.message);
      applyCartResponse(res.data);
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update cart");
      return false;
    }
  };

  /** Remove a whole line in one request, whatever its quantity. */
  const removeLine = async (lineKey) => {
    if (!token) return false;
    try {
      const res = await axios.post(
        `${url}/api/cart/remove-line`,
        { lineKey },
        { headers: { token } }
      );
      if (!res.data.success) throw new Error(res.data.message);
      applyCartResponse(res.data);
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove item");
      return false;
    }
  };

  const clearCart = async () => {
    if (!token) {
      clearLocalCart();
      return;
    }
    try {
      const res = await axios.post(
        `${url}/api/cart/clear`,
        {},
        { headers: { token } }
      );
      if (res.data.success) clearLocalCart();
    } catch (err) {
      console.error("Clear cart error:", err);
    }
  };

  const getTotalCartAmount = useCallback(
    () =>
      cartLines.reduce(
        (total, line) => total + line.unitPrice * line.quantity,
        0
      ),
    [cartLines]
  );

  const getCartItemCount = useCallback(
    () => cartLines.reduce((count, line) => count + line.quantity, 0),
    [cartLines]
  );

  useEffect(() => {
    async function init() {
      await fetchFoodList();
      await fetchRestaurantList();
      await fetchFees();
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
      } else {
        // No session to restore, so hydration ends here.
        setIsHydrated(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserInfo(token);
      loadCartData(token).finally(() => setIsHydrated(true));
    } else {
      clearLocalCart();
      setUser(null);
      localStorage.removeItem("cartItems");
      localStorage.removeItem("cartRestaurantId");
    }
  }, [token]);

  const contextValue = {
    food_list,
    restaurant_list,
    cartLines,
    addToCart,
    updateLine,
    removeLine,
    clearCart,
    getTotalCartAmount,
    getCartItemCount,
    fetchSingleFood,
    fees,
    url,
    token,
    setToken,
    showLogin,
    setShowLogin,
    cartRestaurantId,
    user,
    setUser,
    isLoadingFoods,
    isLoadingRestaurants,
    restaurantError,
    fetchRestaurantList,
    isHydrated,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
