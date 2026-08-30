import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { ShoppingCart, ShoppingBag, LogOut, Sun, Moon, MapPin, UserRound } from "lucide-react";
import { StoreContext } from "../../context/StoreContext";
import Avatar from "../Avatar/Avatar";

const Navbar = ({ setShowLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("mode") === "dark");
  const [scrolled, setScrolled] = useState(false);
  const { getCartItemCount, token, setToken, user, liveLocation, liveAddress } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  // Total number of items in the cart (sum of quantities across lines)
  const cartCount = getCartItemCount();

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

  // When the live bar is hidden the fixed header is one strip shorter, so the
  // static top offset would leave a gap. Flag it on <html> to shrink the offset.
  const addr = liveAddress || user?.address;
  const deliveryAddress = addr
    ? addr.formatted || [addr.address || addr.street, addr.city].filter(Boolean).join(", ")
    : liveLocation
    ? "Updating your location…"
    : "";
  const showLiveBar = Boolean(token && deliveryAddress);

  useEffect(() => {
    document.documentElement.classList.toggle("no-live-bar", !showLiveBar);
  }, [showLiveBar]);

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

  // The live bar greets a signed-in user with where their food will land.
  // Signed out (or no saved address), the bar has nothing personal to say,
  // so we hide it entirely rather than show a generic marketing line.
  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      {showLiveBar && (
        <div className="live-bar">
          <div className="live-bar-msg">
            <MapPin size={14} className="live-bar-pin" />
            <span>
              Delivering to <b>{deliveryAddress}</b>
            </span>
          </div>
          <Link to="/restaurants" className="ds-label gold live-bar-cta">
            BROWSE RESTAURANTS ▾
          </Link>
        </div>
      )}

      <nav className="navbar">
      <Link to="/" aria-label="Home" className="brand">
        <span className="brand-mark ds-serif">Drone Food</span>
      </Link>

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
            <Avatar src={user?.avatar} name={user?.name} size={34} />
            <ul className="nav-profile-dropdown">
              <li onClick={() => navigate("/profile")}>
                <UserRound size={18} />
                <p>Profile</p>
              </li>
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
