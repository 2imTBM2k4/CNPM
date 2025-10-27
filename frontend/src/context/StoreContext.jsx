// import axios from "axios";
// import { createContext, useEffect, useState } from "react";

// export const StoreContext = createContext(null)

// const StoreContextProvider = (props) => {

//     const [cartItems, setCartItems] = useState({});
//     const [showLogin, setShowLogin] = useState(false);
//     const url = "http://localhost:4000"
//     const [token,setToken] = useState("")
//     const [food_list,setFoodList] = useState([])


//     const addToCart = async (itemId, quantity = 1) => {
//         if (!token) {
//             alert("Bạn cần đăng nhập để thêm đồ ăn vào giỏ hàng");
//             setShowLogin(true);
//             return;
//         }
        
//         const currentCart = cartItems || {};
//         let newQuantity = (currentCart[itemId] || 0) + quantity;
        
//         // Update local state
//         setCartItems((prev) => ({ ...prev, [itemId]: newQuantity }));
        
//         // Sync backend: Gọi API quantity lần (đơn giản; có thể optimize backend sau)
//         for (let i = 0; i < quantity; i++) {
//             await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
//         }
//     }

//     const removeFromCart = async (itemId) => {
//         const currentCart = cartItems || {};
//         if (currentCart[itemId] > 0) {
//             let newQuantity = currentCart[itemId] - 1;
//             setCartItems((prev) => ({ ...prev, [itemId]: newQuantity }));
//             if (token) {
//                 await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
//             }
//         }
//     }

//     // Hàm mới: xóa hoàn toàn sản phẩm khỏi giỏ hàng
//     const removeItemFromCart = async (itemId) => {
//         if (!token) {
//             alert("Bạn cần đăng nhập để thực hiện thao tác này");
//             setShowLogin(true);
//             return;
//         }

//         const currentCart = cartItems || {};
//         if (currentCart[itemId] > 0) {
//             // Xóa hoàn toàn khỏi local state
//             setCartItems((prev) => {
//                 const newCart = { ...prev };
//                 delete newCart[itemId];
//                 return newCart;
//             });
            
//             // Sync backend: Gọi API remove nhiều lần bằng số lượng hiện tại
//             if (token) {
//                 const quantityToRemove = currentCart[itemId];
//                 for (let i = 0; i < quantityToRemove; i++) {
//                     await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
//                 }
//             }
//         }
//     }

//     const getTotalCartAmount = () => {
//         let totalAmount = 0;
//         const currentCart = cartItems || {};
//         for (const item in currentCart) 
//         {
//             if (currentCart[item] > 0) {
//                 let itemInfo = food_list.find((product) => product._id === item)
//                 if (itemInfo) {
//                     totalAmount += itemInfo.price * currentCart[item];
//                 }
//             }
//         }
//         return totalAmount;
//     }

//     const fetchFoodList = async () => {
//         const response = await axios.get(url + "/api/food/list");
//         setFoodList(response.data.data)
//     }

//     const loadCartData = async (token) => {
//         const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
//         setCartItems(response.data.cartData || {});
//     }


//     useEffect(()=>{
//         async function loadData() {
//             await fetchFoodList();
//             if (localStorage.getItem("token")) {
//                 setToken(localStorage.getItem("token"));
//                 await loadCartData(localStorage.getItem("token"));
//             }
//         }
//         loadData();
//     },[])


//     const contextValue = {
//         food_list,
//         cartItems,
//         setCartItems,
//         addToCart,
//         removeFromCart,
//         removeItemFromCart, // Thêm hàm mới vào context
//         getTotalCartAmount,
//         url,
//         token,
//         setToken,
//         showLogin,
//         setShowLogin
//     }

//     return (
//         <StoreContext.Provider value={contextValue}>
//             {props.children}
//         </StoreContext.Provider>
//     )
// }

// export default StoreContextProvider;

import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [showLogin, setShowLogin] = useState(false);
  const url = "http://localhost:4000";
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [cartRestaurantId, setCartRestaurantId] = useState(null);  // Mới: Track restaurant của cart

  const addToCart = async (itemId, quantity = 1) => {
    if (!token) {
      alert("Bạn cần đăng nhập để thêm đồ ăn vào giỏ hàng");
      setShowLogin(true);
      return;
    }

    const item = food_list.find((product) => product._id === itemId);
    if (!item) return;

    if (cartRestaurantId && cartRestaurantId !== item.restaurantId) {
      alert("Giỏ hàng chỉ hỗ trợ từ một nhà hàng. Hãy xóa giỏ hiện tại!");
      return;
    }

    setCartRestaurantId(item.restaurantId);  // Set nếu cart empty

    const currentCart = cartItems || {};
    let newQuantity = (currentCart[itemId] || 0) + quantity;
    setCartItems((prev) => ({ ...prev, [itemId]: newQuantity }));

    for (let i = 0; i < quantity; i++) {
      await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
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
        setCartRestaurantId(null);  // Reset nếu cart empty
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

  const loadCartData = async (token) => {
    const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
    setCartItems(response.data.cartData || {});

    // Set cartRestaurantId từ item đầu tiên
    const cartData = response.data.cartData || {};
    const firstItemId = Object.keys(cartData)[0];
    if (firstItemId) {
      const item = food_list.find((product) => product._id === firstItemId);
      if (item) setCartRestaurantId(item.restaurantId);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      if (localStorage.getItem("token")) {
        setToken(localStorage.getItem("token"));
        await loadCartData(localStorage.getItem("token"));
      }
    }
    loadData();
  }, []);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    removeItemFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
    showLogin,
    setShowLogin
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;