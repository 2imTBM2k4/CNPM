import React, { useContext } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Add from "./pages/Add/Add";
import ListRestaurant from "./pages/ListRestaurant/ListRestaurant";
import Orders from "./pages/Orders/Orders";
import Dashboard from "./pages/Dashboard/Dashboard";
import ListUsers from "./pages/ListUsers/ListUsers";
import Login from "./pages/Login/Login";
import Drones from "./pages/Drones/Drones";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "./context/AuthContext"; // Thêm

const App = () => {
  const { user, isLoading } = useContext(AuthContext); // Sử dụng từ context
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Optional loading
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="app">
        <ToastContainer />
        <Login url={url} />
      </div>
    );
  }

  return (
    <div className="app">
      <ToastContainer />
      <Sidebar />
      <div className="main-content-area">
        <Navbar />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard url={url} />} />
            <Route
              path="/list-restaurants"
              element={<ListRestaurant url={url} />}
            />
            <Route path="/list-users" element={<ListUsers url={url} />} />
            <Route path="/orders" element={<Orders url={url} />} />
            <Route path="/drones" element={<Drones url={url} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
