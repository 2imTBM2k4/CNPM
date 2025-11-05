import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Footer from "./components/Footer/Footer";
import { useContext } from "react";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import { StoreContext } from "./context/StoreContext";
import StoreContextProvider from "./context/StoreContext";
import FoodPage from "./pages/Food/FoodPage"; // Giữ nhưng có thể comment nếu không cần
import RestaurantPage from "./pages/Restaurant/RestaurantPage"; // Thêm import
import Payment from "./pages/Payment/Payment";
const App = () => {
  const { showLogin, setShowLogin } = useContext(StoreContext);

  return (
    <StoreContextProvider>
      <>
        {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
        <div className="main-content">
          <Navbar setShowLogin={setShowLogin} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />{" "}
            {/* Thêm route */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/order" element={<PlaceOrder />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/myorders" element={<MyOrders />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/placeorder" element={<PlaceOrder />} />{" "}
            {/* Nếu chưa có */}
            <Route path="/payment" element={<Payment />} /> {/* Add này */}
          </Routes>
        </div>
        <Footer />
        <ToastContainer />
      </>
    </StoreContextProvider>
  );
};

export default App;
