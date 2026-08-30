import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Clock, Store, Star } from "lucide-react";
import { StoreContext } from "../../context/StoreContext";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const { user, liveLocation, liveAddress } = useContext(StoreContext);

  const addr = liveAddress || user?.address;
  const deliveryAddress = addr
    ? addr.formatted || [addr.address || addr.street, addr.city].filter(Boolean).join(", ")
    : liveLocation
    ? "Updating your location…"
    : "";

  return (
    <header className="header">
      <div className="header-overlay" aria-hidden="true" />
      <div className="header-inner">
        <span className="header-eyebrow">Drone Food</span>
        <h1 className="header-title">
          Order food to your door in fifteen minutes
        </h1>
        <p className="header-sub">
          Fresh meals from the best local restaurants, flown straight to you.
        </p>

        <div className="header-search">
          <span className="header-location" title={deliveryAddress}>
            <MapPin size={16} />
            <span className="header-location-text">
              {deliveryAddress || "Set your delivery address"}
            </span>
          </span>
          <button
            type="button"
            className="header-search-btn"
            onClick={() => navigate("/restaurants")}
          >
            <Search size={16} />
            Find restaurants near you
          </button>
        </div>

        <div className="header-badges">
          <span className="header-badge">
            <Clock size={14} />
            15 min delivery
          </span>
          <span className="header-badge">
            <Store size={14} />
            500+ restaurants
          </span>
          <span className="header-badge">
            <Star size={14} fill="currentColor" strokeWidth={0} />
            4.8 average rating
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
