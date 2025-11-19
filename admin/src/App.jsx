// import React, { useEffect, useState } from "react";
// import Navbar from "./components/Navbar/Navbar";
// import Sidebar from "./components/Sidebar/Sidebar";
// import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
// import Add from "./pages/Add/Add";
// import ListRestaurant from "./pages/ListRestaurant/ListRestaurant";
// import Orders from "./pages/Orders/Orders";
// import Dashboard from "./pages/Dashboard/Dashboard";
// import ListUsers from "./pages/ListUsers/ListUsers";
// import Login from "./pages/Login/Login";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const App = () => {
//   const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   // SỬA: Thêm state cho mobile menu toggle (optional, để hỗ trợ mở/đóng sidebar trên mobile)
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = () => {
//     const token = localStorage.getItem("token");
//     const userRole = localStorage.getItem("userRole");

//     if (token && userRole === "admin") {
//       setIsAuthenticated(true);
//       if (location.pathname === "/login") {
//         navigate("/", { replace: true });
//       }
//     } else {
//       setIsAuthenticated(false);
//       if (location.pathname !== "/login") {
//         navigate("/login", { replace: true });
//       }
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("userRole");
//     setIsAuthenticated(false);
//     navigate("/login");
//   };

//   // SỬA: Thêm function toggle mobile menu (gọi từ Navbar nếu có hamburger button)
//   const handleMobileToggle = () => {
//     setIsMobileMenuOpen(!isMobileMenuOpen);
//   };

//   // Chỉ hiển thị login page khi chưa authenticated
//   if (!isAuthenticated) {
//     return (
//       <div className="app">
//         <ToastContainer />
//         <Login url={url} />
//       </div>
//     );
//   }

//   // Layout chính với sidebar cố định và content riêng biệt
//   return (
//     <div className="app">
//       <ToastContainer />
//       {/* SỬA: Truyền props cho Sidebar để hỗ trợ mobile toggle */}
//       <Sidebar
//         mobileOpen={isMobileMenuOpen}
//         onMobileToggle={handleMobileToggle}
//       />

//       {/* Main content area - hoàn toàn tách biệt */}
//       <div className="main-content-area">
//         {/* SỬA: Truyền handleMobileToggle cho Navbar nếu bạn có hamburger button ở đó */}
//         <Navbar onLogout={handleLogout} onMobileToggle={handleMobileToggle} />
//         <div className="page-content">
//           <Routes>
//             <Route path="/" element={<Dashboard url={url} />} />
//             {/* <Route path="/add" element={<Add url={url} />} /> */}
//             <Route
//               path="/list-restaurants"
//               element={<ListRestaurant url={url} />}
//             />
//             <Route path="/list-users" element={<ListUsers url={url} />} />
//             <Route path="/orders" element={<Orders url={url} />} />
//           </Routes>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default App;

// admin/src/App.jsx (Sửa để dùng AuthContext thay vì state thủ công)
import React, { useContext } from "react"; // Thêm useContext
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
