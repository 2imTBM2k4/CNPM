import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import "./FloatingCartBar.css";
import { StoreContext } from "../../context/StoreContext";

/** Routes where the cart is already the subject of the page. */
const HIDDEN_ROUTES = ["/cart", "/checkout", "/payment", "/placeorder", "/order"];

const FloatingCartBar = () => {
  const { getCartItemCount, getTotalCartAmount, token } =
    useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();

  const itemCount = getCartItemCount();

  const isHidden =
    !token || itemCount === 0 || HIDDEN_ROUTES.includes(location.pathname);

  const total = getTotalCartAmount();

  return (
    <div
      className={`floating-cart-bar ${isHidden ? "" : "visible"}`}
      aria-hidden={isHidden}
    >
      <button
        type="button"
        className="floating-cart-inner"
        onClick={() => navigate("/cart")}
        tabIndex={isHidden ? -1 : 0}
      >
        <span className="floating-cart-icon">
          <ShoppingBag size={18} strokeWidth={1.8} />
          <span className="floating-cart-count ds-num">{itemCount}</span>
        </span>

        <span className="floating-cart-text">
          {itemCount} {itemCount === 1 ? "item" : "items"}
          <span className="floating-cart-sep">·</span>
          <span className="ds-num">${total.toFixed(2)}</span>
        </span>

        <span className="floating-cart-cta">
          <span className="floating-cart-cta-label">View cart</span>
          <ArrowRight size={15} />
        </span>
      </button>
    </div>
  );
};

export default FloatingCartBar;
