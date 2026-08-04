import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { ShoppingCart, ShoppingBag, LogOut, Sun, Moon } from "lucide-react";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("mode") === "dark");
  const [scrolled, setScrolled] = useState(false);
  const { cartItems, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  // Total number of items in the cart (sum of quantities)
  const cartCount = Object.values(cartItems || {}).reduce(
    (sum, qty) => sum + (qty > 0 ? qty : 0),
    0
  );

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark-mode");
      localStorage.setItem("mode", "dark");
    } else {
      root.classList.remove("dark-mode");
      localStorage.setItem("mode", "light");
    }
  }, [isDark]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (mobileMenuOpen || profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen, profileOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <div className="live-bar">
        <div className="live-bar-msg">
          <span className="dot" />
          <span>
            Ho Chi Minh City · <b>24 kitchens in range</b> — hot food at your
            window in fifteen minutes
          </span>
        </div>
        <Link to="/food" className="ds-label gold live-bar-cta">
          SEE MENU ▾
        </Link>
      </div>

      <nav className="navbar">
      <Link to="/" aria-label="Home" className="brand">
        <span className="brand-mark ds-serif">Drone Delivery</span>
      </Link>

      <ul className={`navbar-menu ${mobileMenuOpen ? "open" : ""}`} ref={menuRef}>
        <li>
          <Link to="/" className={isActive("/") ? "active" : ""}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/food" className={isActive("/food") ? "active" : ""}>
            Menu
          </Link>
        </li>
      </ul>

      <div className="navbar-right">
        <button
          className="theme-toggle"
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="navbar-search-icon">
          <Link to="/cart" aria-label={`Cart, ${cartCount} items`} className="basketlogo">
            <ShoppingCart size={22} />
          </Link>
          {cartCount > 0 && (
            <span className="cart-count">{cartCount > 99 ? "99+" : cartCount}</span>
          )}
        </div>
        {!token ? (
          <button className="signbutton" onClick={() => setShowLogin(true)}>
            Sign in
          </button>
        ) : (
          <div
            className={`navbar-profile ${profileOpen ? "open" : ""}`}
            ref={profileRef}
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <img src={assets.profile_icon} alt="Profile" />
            <ul className="nav-profile-dropdown">
              <li onClick={() => navigate("/myorders")}>
                <ShoppingBag size={18} />
                <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <LogOut size={18} />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
        <button
          className={`hamburger ${mobileMenuOpen ? "open" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      </nav>
    </header>
  );
};

export default Navbar;
