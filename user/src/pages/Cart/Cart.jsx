import React, { useState, useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShoppingCart } from "lucide-react";
import { EmptyState } from "../../../../shared/components/StateBlock";
import ItemOptionsSheet from "../../components/ItemOptionsSheet/ItemOptionsSheet";

const Cart = () => {
  const {
    cartLines,
    food_list,
    updateLine,
    removeLine,
    getTotalCartAmount,
    fees,
    url,
    token,
    setShowLogin,
  } = useContext(StoreContext);
  const navigate = useNavigate();
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [editingLine, setEditingLine] = useState(null);

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal > 0 ? fees.deliveryFee : 0;
  const serviceFee = subtotal > 0 ? fees.serviceFee : 0;
  const total = subtotal + deliveryFee + serviceFee;

  const getImageUrl = (line) => {
    if (!line?.image) return "/placeholder.png";
    return line.image.startsWith("http")
      ? line.image
      : `${url}/images/${line.image}`;
  };

  const handleDecrease = (line) => {
    if (line.quantity > 1) {
      updateLine(line.lineKey, line.quantity - 1);
    } else {
      setPendingRemoval(line);
    }
  };

  const handleConfirmRemove = async () => {
    const removed = await removeLine(pendingRemoval.lineKey);
    if (removed) toast.success("Item removed from cart");
    setPendingRemoval(null);
  };

  const openEditor = (line) => {
    const dish = food_list.find((food) => food._id === line.foodId);
    setEditingLine({
      line,
      item: {
        _id: line.foodId,
        name: line.name,
        price: line.basePrice,
        image: line.image,
        description: dish?.description || "",
        optionGroups: dish?.optionGroups || [],
      },
    });
  };

  const handleProceedCheckout = () => {
    if (!token) {
      toast.error("Please sign in to continue");
      setShowLogin(true);
      return;
    }
    if (cartLines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="cart">
      {pendingRemoval && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>Confirm removal</h3>
            <p>Remove “{pendingRemoval.name}” from your cart?</p>
            <div className="confirm-dialog-buttons">
              <button className="confirm-btn" onClick={handleConfirmRemove}>
                Yes, remove it
              </button>
              <button
                className="cancel-btn"
                onClick={() => setPendingRemoval(null)}
              >
                No, keep it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-items">
        {cartLines.length > 0 && (
          <>
            <div className="cart-items-title">
              <p>Image</p>
              <p>Name</p>
              <p>Price</p>
              <p>Quantity</p>
              <p>Total</p>
              <p>Remove</p>
            </div>
            <br />
            <hr />
          </>
        )}

        {cartLines.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Add a few dishes and they'll show up here, ready for the drone."
            actionLabel="Browse restaurants"
            onAction={() => navigate("/")}
          />
        ) : (
          cartLines.map((line) => (
            <div key={line.lineKey}>
              <div className="cart-items-title cart-items-item">
                <div className="cart-item-image">
                  <img
                    src={getImageUrl(line)}
                    alt={line.name}
                    onError={(e) => {
                      e.target.src = "/placeholder.png";
                    }}
                    loading="lazy"
                  />
                </div>
                <div className="cart-item-name">
                  <p>{line.name}</p>
                  {line.selectedOptions.length > 0 && (
                    <p className="cart-item-options">
                      {line.selectedOptions
                        .map((option) => option.optionName)
                        .join(" · ")}
                    </p>
                  )}
                  {line.note && (
                    <p className="cart-item-note">“{line.note}”</p>
                  )}
                  <button
                    type="button"
                    className="cart-item-edit"
                    onClick={() => openEditor(line)}
                  >
                    Edit
                  </button>
                </div>
                <p className="cart-item-price">${line.unitPrice.toFixed(2)}</p>
                <div className="quantity-controls">
                  <button
                    className="quantity-btn decrease"
                    onClick={() => handleDecrease(line)}
                    aria-label={`Decrease quantity of ${line.name}`}
                  >
                    -
                  </button>
                  <span className="quantity-display">{line.quantity}</span>
                  <button
                    className="quantity-btn increase"
                    onClick={() => updateLine(line.lineKey, line.quantity + 1)}
                    aria-label={`Increase quantity of ${line.name}`}
                  >
                    +
                  </button>
                </div>
                <p className="cart-item-total">
                  ${(line.unitPrice * line.quantity).toFixed(2)}
                </p>
                <p
                  onClick={() => setPendingRemoval(line)}
                  className="cross"
                  title="Remove item"
                >
                  x
                </p>
              </div>
              <hr />
            </div>
          ))
        )}
      </div>

      {cartLines.length > 0 && (
        <div className="cart-bottom">
          <div className="cart-total">
            <h2>Cart Totals</h2>
            <div>
              <div className="cart-total-details">
                <p>Subtotal</p>
                <p className="ds-num">${subtotal.toFixed(2)}</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <p>Delivery Fee</p>
                <p className="ds-num">${deliveryFee.toFixed(2)}</p>
              </div>
              {serviceFee > 0 && (
                <>
                  <hr />
                  <div className="cart-total-details">
                    <p>Service Fee</p>
                    <p className="ds-num">${serviceFee.toFixed(2)}</p>
                  </div>
                </>
              )}
              <hr />
              <div className="cart-total-details">
                <b>Total</b>
                <b className="ds-num">${total.toFixed(2)}</b>
              </div>
            </div>
            <button onClick={handleProceedCheckout}>PROCEED TO CHECKOUT</button>
          </div>
        </div>
      )}

      {editingLine && (
        <CartLineEditor
          editing={editingLine}
          onClose={() => setEditingLine(null)}
        />
      )}
    </div>
  );
};

/**
 * Wraps ItemOptionsSheet for editing an existing line. Because a line's
 * identity includes its options, "editing" means removing the old line and
 * adding the new one.
 */
const CartLineEditor = ({ editing, onClose }) => {
  const { addToCart, removeLine } = useContext(StoreContext);

  const handleSubmit = async ({ quantity, selectedOptions, note }) => {
    const removed = await removeLine(editing.line.lineKey);
    if (!removed) return false;

    const added = await addToCart(
      editing.line.foodId,
      quantity,
      selectedOptions,
      note
    );
    if (added) toast.success("Item updated");
    return added;
  };

  return (
    <ItemOptionsSheet
      item={editing.item}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Save changes"
      initial={{
        quantity: editing.line.quantity,
        selectedOptions: editing.line.selectedOptions,
        note: editing.line.note,
      }}
    />
  );
};

export default Cart;
