// import React from "react";
// import "./Navbar.css";
// import { assets } from "../../assets/assets";
// import { useNavigate } from "react-router-dom";

// const Navbar = ({ onLogout }) => {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     if (window.confirm("Are you sure you want to logout?")) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("userRole");
//       navigate("/login");
//     }
//   };

//   return (
//     <div className="navbar">
//       <img className="logo" src={assets.logo} alt="Logo" />
//       <div className="navbar-right">
//         <img className="profile" src={assets.profile_image} alt="Profile" />
//         <button onClick={handleLogout} className="logout-btn">
//           Logout
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Navbar;

// admin/src/components/Navbar/Navbar.jsx
import React, { useContext } from "react"; // Thêm useContext nếu chưa
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext"; // Thêm nếu có AuthContext

const Navbar = ({ onLogout }) => {
  const { user, logout } = useContext(AuthContext); // Sử dụng AuthContext
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout(); // Sử dụng logout từ context
    }
  };

  return (
    <div className="navbar">
      <img className="logo" src={assets.logo} alt="Logo" />
      <div className="navbar-right">
        {user && (
          <span className="balance">
            Balance: ${user.walletBalance?.toFixed(2) || "0.00"}
          </span> // Mới: Hiển thị balance
        )}
        <img className="profile" src={assets.profile_image} alt="Profile" />
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
