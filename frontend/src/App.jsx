import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar/Navbar';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import Footer from './components/Footer/Footer';
import { useContext } from 'react';
import LoginPopup from './components/LoginPopup/LoginPopup';
import Verify from './pages/Verify/Verify';
import MyOrders from './pages/MyOrders/MyOrders';
import ProductDetail from './pages/ProductDetail/ProductDetail'; // Thêm import này
import { StoreContext } from './context/StoreContext';
import StoreContextProvider from './context/StoreContext';

const App = () => {
  const { showLogin, setShowLogin } = useContext(StoreContext);

  return (
    <StoreContextProvider>
      <>
        {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
        <div className="app">
          <Navbar setShowLogin={setShowLogin} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order" element={<PlaceOrder />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/myorders" element={<MyOrders />} />
            <Route path="/product/:id" element={<ProductDetail />} /> {/* Thêm route này */}
          </Routes>
        </div>
        <Footer />
        <ToastContainer />
      </>
    </StoreContextProvider>
  );
};

export default App;