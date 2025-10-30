// import axios from "axios";  // Uncomment
// import { createContext, useEffect, useState } from "react";

// export const StoreContext = createContext(null);

// const StoreContextProvider = (props) => {
//   const [cartItems, setCartItems] = useState({});
//   const [showLogin, setShowLogin] = useState(false);
//   const url = "http://localhost:4000";
//   const [token, setToken] = useState("");
//   const [food_list, setFoodList] = useState([]);
//   const [restaurant_list, setRestaurantList] = useState([]);  // Thêm state restaurant_list
//   const [cartRestaurantId, setCartRestaurantId] = useState(null);  // Đã có

//   // SỬA: addToCart return boolean (thành công: true, thất bại: false)
//   const addToCart = async (itemId, quantity = 1) => {
//     if (!token) {
//       alert("Bạn cần đăng nhập để thêm đồ ăn vào giỏ hàng");
//       setShowLogin(true);
//       return false;  // SỬA: Return false để frontend biết thất bại
//     }

//     const item = food_list.find((product) => product._id === itemId);
//     if (!item) {
//       alert("Sản phẩm không tồn tại!");
//       return false;  // Thêm: Return false nếu không tìm thấy item
//     }

//     if (cartRestaurantId && cartRestaurantId !== item.restaurantId) {
//       alert("Giỏ hàng chỉ hỗ trợ từ một nhà hàng. Hãy xóa giỏ hiện tại!");
//       return false;  // SỬA: Return false thay vì return void
//     }

//     setCartRestaurantId(item.restaurantId);  // Set nếu cart empty

//     const currentCart = cartItems || {};
//     let newQuantity = (currentCart[itemId] || 0) + quantity;
//     setCartItems((prev) => ({ ...prev, [itemId]: newQuantity }));

//     try {
//       for (let i = 0; i < quantity; i++) {
//         await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
//       }
//       return true;  // Thành công: return true
//     } catch (error) {
//       console.error("Lỗi thêm vào cart:", error);
//       // Rollback state nếu API lỗi
//       setCartItems(currentCart);  // Khôi phục cart cũ
//       alert("Lỗi khi thêm vào giỏ hàng!");
//       return false;
//     }
//   };

//   const removeFromCart = async (itemId) => {
//     const currentCart = cartItems || {};
//     if (currentCart[itemId] > 0) {
//       let newQuantity = currentCart[itemId] - 1;
//       setCartItems((prev) => ({ ...prev, [itemId]: newQuantity }));
//       if (token) {
//         await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
//       }
//       if (newQuantity === 0 && Object.keys(currentCart).length === 1) {
//         setCartRestaurantId(null);  // Reset nếu cart empty
//       }
//     }
//   };

//   const removeItemFromCart = async (itemId) => {
//     if (!token) {
//       alert("Bạn cần đăng nhập để thực hiện thao tác này");
//       setShowLogin(true);
//       return;
//     }

//     const currentCart = cartItems || {};
//     if (currentCart[itemId] > 0) {
//       setCartItems((prev) => {
//         const newCart = { ...prev };
//         delete newCart[itemId];
//         return newCart;
//       });

//       if (token) {
//         const quantityToRemove = currentCart[itemId];
//         for (let i = 0; i < quantityToRemove; i++) {
//           await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
//         }
//       }

//       if (Object.keys(currentCart).length === 1) {
//         setCartRestaurantId(null);
//       }
//     }
//   };

//   const getTotalCartAmount = () => {
//     let totalAmount = 0;
//     const currentCart = cartItems || {};
//     for (const item in currentCart) {
//       if (currentCart[item] > 0) {
//         let itemInfo = food_list.find((product) => product._id === item);
//         if (itemInfo) {
//           totalAmount += itemInfo.price * currentCart[item];
//         }
//       }
//     }
//     return totalAmount;
//   };

//   const fetchFoodList = async () => {
//     const response = await axios.get(url + "/api/food/list");
//     setFoodList(response.data.data);
//   };

//   const fetchRestaurantList = async () => {  // Thêm hàm fetch restaurant
//     const response = await axios.get(url + "/api/restaurant/list");
//     setRestaurantList(response.data.data || []);
//   };

//   const loadCartData = async (token) => {
//     const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
//     setCartItems(response.data.cartData || {});

//     // Set cartRestaurantId từ item đầu tiên
//     const cartData = response.data.cartData || {};
//     const firstItemId = Object.keys(cartData)[0];
//     if (firstItemId) {
//       const item = food_list.find((product) => product._id === firstItemId);
//       if (item) setCartRestaurantId(item.restaurantId);
//     }
//   };

//   useEffect(() => {
//     async function loadData() {
//       await fetchFoodList();
//       await fetchRestaurantList();  // Thêm call fetch restaurant
//       if (localStorage.getItem("token")) {
//         setToken(localStorage.getItem("token"));
//         await loadCartData(localStorage.getItem("token"));
//       }
//     }
//     loadData();
//   }, []);

//   const contextValue = {
//     food_list,
//     restaurant_list,  // Thêm vào context
//     cartItems,
//     setCartItems,
//     addToCart,
//     removeFromCart,
//     removeItemFromCart,
//     getTotalCartAmount,
//     url,
//     token,
//     setToken,
//     showLogin,
//     setShowLogin,
//     cartRestaurantId,  // Thêm nếu cần
//   };

//   return (
//     <StoreContext.Provider value={contextValue}>
//       {props.children}
//     </StoreContext.Provider>
//   );
// };

// export default StoreContextProvider;

import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const url = "http://localhost:4000";
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [restaurant_list, setRestaurantList] = useState([]);
  const [cartRestaurantId, setCartRestaurantId] = useState(null);

  const addToCart = async (itemId, quantity = 1) => {
    if (!token) {
      alert("Bạn cần đăng nhập để thêm đồ ăn vào giỏ hàng");
      setShowLogin(true);
      return false;
    }

    const item = food_list.find((product) => product._id === itemId);
    if (!item) {
      alert("Sản phẩm không tồn tại!");
      return false;
    }

    if (cartRestaurantId && cartRestaurantId !== item.restaurantId) {
      alert("Giỏ hàng chỉ hỗ trợ từ một nhà hàng. Hãy xóa giỏ hiện tại!");
      return false;
    }

    setCartRestaurantId(item.restaurantId);

    const currentCart = cartItems || {};
    let newQuantity = (currentCart[itemId] || 0) + quantity;
    setCartItems((prev) => ({ ...prev, [itemId]: newQuantity }));

    try {
      for (let i = 0; i < quantity; i++) {
        await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
      }
      return true;
    } catch (error) {
      console.error("Lỗi thêm vào cart:", error);
      setCartItems(currentCart);
      alert("Lỗi khi thêm vào giỏ hàng!");
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    const currentCart = cartItems || {};
    if (currentCart[itemId] > 0) {
      let newQuantity = currentCart[itemId] - 1;
      setCartItems((prev) => ({ ...prev, [itemId]: newQuantity }));
      if (token) {
        await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
      }
      if (newQuantity === 0 && Object.keys(currentCart).length === 1) {
        setCartRestaurantId(null);
      }
    }
  };

  const removeItemFromCart = async (itemId) => {
    if (!token) {
      alert("Bạn cần đăng nhập để thực hiện thao tác này");
      setShowLogin(true);
      return;
    }

    const currentCart = cartItems || {};
    if (currentCart[itemId] > 0) {
      setCartItems((prev) => {
        const newCart = { ...prev };
        delete newCart[itemId];
        return newCart;
      });

      if (token) {
        const quantityToRemove = currentCart[itemId];
        for (let i = 0; i < quantityToRemove; i++) {
          await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
        }
      }

      if (Object.keys(currentCart).length === 1) {
        setCartRestaurantId(null);
      }
    }
  };

  // MỚI: Clear toàn bộ cart (local + backend)
  const clearCart = async () => {
    if (!token) {
      // Không login: Chỉ clear local
      setCartItems({});
      setCartRestaurantId(null);
      return true;
    }

    try {
      // Loop remove all items từ backend (dùng removeItemFromCart logic)
      const currentCart = { ...cartItems };
      for (const itemId in currentCart) {
        if (currentCart[itemId] > 0) {
          const quantityToRemove = currentCart[itemId];
          for (let i = 0; i < quantityToRemove; i++) {
            await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
          }
        }
      }
      // Clear local state
      setCartItems({});
      setCartRestaurantId(null);
      console.log('Cart cleared successfully');
      return true;
    } catch (error) {
      console.error("Lỗi clear cart:", error);
      // Fallback: Clear local anyway
      setCartItems({});
      setCartRestaurantId(null);
      alert("Giỏ hàng đã được xóa ở phía client, nhưng backend có lỗi. Vui lòng refresh.");
      return false;
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    const currentCart = cartItems || {};
    for (const item in currentCart) {
      if (currentCart[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * currentCart[item];
        }
      }
    }
    return totalAmount;
  };

  const fetchFoodList = async () => {
    const response = await axios.get(url + "/api/food/list");
    setFoodList(response.data.data);
  };

  const fetchRestaurantList = async () => {
    const response = await axios.get(url + "/api/restaurant/list");
    setRestaurantList(response.data.data || []);
  };

  const loadCartData = async (token) => {
    const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
    setCartItems(response.data.cartData || {});

    const cartData = response.data.cartData || {};
    const firstItemId = Object.keys(cartData)[0];
    if (firstItemId) {
      const item = food_list.find((product) => product._id === firstItemId);
      if (item) setCartRestaurantId(item.restaurantId);
    }
  };

  const fetchUserInfo = async (token) => {
    try {
      const response = await axios.get(url + "/api/user/me", { headers: { token } });
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Lỗi fetch user info:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      await fetchRestaurantList();
      const localToken = localStorage.getItem("token");
      if (localToken) {
        setToken(localToken);
        await loadCartData(localToken);
        await fetchUserInfo(localToken);
      }
    }
    loadData();
  }, []);

  const contextValue = {
    food_list,
    restaurant_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    removeItemFromCart,
    clearCart, // MỚI: Expose clearCart
    getTotalCartAmount,
    url,
    token,
    setToken,
    showLogin,
    setShowLogin,
    cartRestaurantId,
    user,
    setUser,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;