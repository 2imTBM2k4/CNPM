import React from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";

const Sidebar = ({ mobileOpen = false, onMobileToggle }) => {
  // SỬA: Thêm props cho mobile
  const menuItems = [
    {
      path: "/",
      icon: assets.order_icon,
      label: "Dashboard",
      className: "dash",
    },
    // {
    //   path: "/add",
    //   icon: assets.add_icon,
    //   label: "Add Restaurant",
    //   className: "addd",
    // },
    {
      path: "/list-restaurants",
      icon: assets.order_icon,
      label: "Restaurants",
      className: "listt",
    },
    {
      path: "/list-users",
      icon: assets.profile_image,
      label: "Users",
      className: "users",
    },
    {
      path: "/orders",
      icon: assets.parcel_icon,
      label: "Orders",
      className: "orderr",
    },
    {
      path: "/drones",
      icon: assets.parcel_icon,
      label: "Drones",
      className: "drones",
    },
  ];

  // SỬA: Function toggle cho mobile (gọi khi click close button hoặc menu item)
  const handleMobileToggle = () => {
    if (onMobileToggle) {
      onMobileToggle();
    }
  };

  return (
    <div className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      {" "}
      {/* SỬA: Thêm class động cho mobile */}
      <div className="sidebar-header">
        <h3 className="sidebar-title">Admin Panel</h3>
        {/* SỬA: Optional - Button đóng sidebar trên mobile */}
        {mobileOpen && window.innerWidth <= 768 && (
          <button
            onClick={handleMobileToggle}
            className="mobile-close-btn"
            style={{
              display: "block",
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "white",
              fontSize: "1.5rem",
              cursor: "pointer",
              float: "right",
            }}
          >
            ×
          </button>
        )}
      </div>
      <div className="sidebar-options">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-option ${isActive ? "active" : ""}`
            }
            end={item.path === "/"} // Use exact matching for dashboard
            onClick={handleMobileToggle} // SỬA: Đóng menu khi click item trên mobile
          >
            <img className={item.className} src={item.icon} alt={item.label} />
            <p>{item.label}</p>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
