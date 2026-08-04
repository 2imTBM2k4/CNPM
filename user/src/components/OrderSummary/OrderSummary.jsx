import React, { useContext, useState } from "react";
import { ChevronUp } from "lucide-react";
import "./OrderSummary.css";
import { StoreContext } from "../../context/StoreContext";

/**
 * The running cost of the order: lines, then every fee spelled out.
 *
 * Sticky beside the checkout on desktop; on mobile it collapses to a bar at
 * the bottom that expands on tap. Fees come from the server (GET
 * /api/config/fees) so what's shown here is what gets charged.
 */
const OrderSummary = ({ collapsible = true }) => {
  const { cartLines, getTotalCartAmount, fees } = useContext(StoreContext);
  const [expanded, setExpanded] = useState(false);

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal > 0 ? fees.deliveryFee : 0;
  const serviceFee = subtotal > 0 ? fees.serviceFee : 0;
  const total = subtotal + deliveryFee + serviceFee;

  return (
    <aside
      className={`order-summary ${collapsible ? "collapsible" : ""} ${
        expanded ? "expanded" : ""
      }`}
    >
      {collapsible && (
        <button
          type="button"
          className="order-summary-toggle"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          <span>{expanded ? "Hide" : "Show"} order details</span>
          <span className="order-summary-toggle-right">
            <span className="ds-num">${total.toFixed(2)}</span>
            <ChevronUp size={16} className="order-summary-chevron" />
          </span>
        </button>
      )}

      <div className="order-summary-panel">
        <h3 className="order-summary-title">Order summary</h3>

        <ul className="order-summary-lines">
          {cartLines.map((line) => (
            <li key={line.lineKey} className="order-summary-line">
              <span className="order-summary-qty ds-num">{line.quantity}×</span>
              <span className="order-summary-line-body">
                <span className="order-summary-name">{line.name}</span>
                {line.selectedOptions.length > 0 && (
                  <span className="order-summary-options">
                    {line.selectedOptions
                      .map((option) => option.optionName)
                      .join(" · ")}
                  </span>
                )}
                {line.note && (
                  <span className="order-summary-note">“{line.note}”</span>
                )}
              </span>
              <span className="order-summary-amount ds-num">
                ${(line.unitPrice * line.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="order-summary-fees">
          <div className="order-summary-row">
            <span>Subtotal</span>
            <span className="ds-num">${subtotal.toFixed(2)}</span>
          </div>
          <div className="order-summary-row">
            <span>Delivery fee</span>
            <span className="ds-num">${deliveryFee.toFixed(2)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="order-summary-row">
              <span>Service fee</span>
              <span className="ds-num">${serviceFee.toFixed(2)}</span>
            </div>
          )}
          <div className="order-summary-row order-summary-total">
            <span>Total</span>
            <span className="ds-num">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
