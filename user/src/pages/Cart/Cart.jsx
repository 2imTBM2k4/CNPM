import React, { useState } from "react";
import "./Cart.css";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Cart = () => {
  const {
    cartItems,
    food_list,
    removeFromCart,
    removeItemFromCart,
    getTotalCartAmount,
    url,
    addToCart,
  } = useContext(StoreContext);
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(null); // Lưu itemId cần xác nhận xóa
  const [confirmAction, setConfirmAction] = useState(""); // 'remove' hoặc 'delete'

  // Hàm xử lý tăng số lượng
  const handleIncreaseQuantity = async (itemId) => {
    await addToCart(itemId, 1);
  };

  // Hàm xử lý giảm số lượng
  const handleDecreaseQuantity = async (itemId) => {
    const currentQuantity = cartItems[itemId];

    if (currentQuantity > 1) {
      // Nếu số lượng > 1, giảm bình thường
      await removeFromCart(itemId);
    } else {
      // Nếu số lượng = 1, hiển thị confirm dialog để xóa hoàn toàn
      setShowConfirm(itemId);
      setConfirmAction("remove");
    }
  };

  // Hàm xử lý click nút "x" - xóa hoàn toàn
  const handleDeleteClick = (itemId) => {
    setShowConfirm(itemId);
    setConfirmAction("delete");
  };

  // Hàm xác nhận xóa sản phẩm
  const handleConfirmRemove = async (itemId) => {
    if (confirmAction === "delete") {
      // Xóa hoàn toàn sản phẩm
      await removeItemFromCart(itemId);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } else {
      // Xóa khi số lượng = 1 (giảm về 0)
      await removeFromCart(itemId);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    }
    setShowConfirm(null);
    setConfirmAction("");
  };

  // Hàm hủy xóa sản phẩm
  const handleCancelRemove = () => {
    setShowConfirm(null);
    setConfirmAction("");
  };

  // Lấy thông báo confirm dựa trên action
  const getConfirmMessage = () => {
    if (confirmAction === "delete") {
      return "Bạn có chắc chắn muốn xóa hoàn toàn sản phẩm này khỏi giỏ hàng?";
    } else {
      return "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?";
    }
  };

  // Kiểm tra nếu giỏ hàng rỗng
  const isCartEmpty =
    Object.keys(cartItems).filter((itemId) => cartItems[itemId] > 0).length ===
    0;

  return (
    <div className="cart">
      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>Xác nhận xóa</h3>
            <p>{getConfirmMessage()}</p>
            <div className="confirm-dialog-buttons">
              <button
                className="confirm-btn"
                onClick={() => handleConfirmRemove(showConfirm)}
              >
                Có, xóa sản phẩm
              </button>
              <button className="cancel-btn" onClick={handleCancelRemove}>
                Không, giữ lại
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-items">
        <div className="cart-items-title">
          <p>Hình ảnh</p>
          <p>Tên món</p>
          <p>Giá</p>
          <p>Số lượng</p>
          <p>Tổng</p>
          <p>Xóa</p>
        </div>
        <br />
        <hr />
        {food_list.length === 0 ? (
          <div className="empty-cart-message">
            <p>Đang tải danh sách món ăn...</p>
          </div>
        ) : isCartEmpty ? (
          <div className="empty-cart-message">
            <p>Giỏ hàng của bạn đang trống</p>
          </div>
        ) : (
          food_list.map((item) => {
            if (cartItems[item._id] > 0) {
              const imageUrl = item.image?.startsWith("http")
                ? item.image
                : url + "/images/" + item.image;

              return (
                <div key={item._id}>
                  <div className="cart-items-title cart-items-item">
                    <div className="cart-item-image">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                        }}
                        loading="lazy"
                      />
                    </div>
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">${item.price}</p>
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn decrease"
                        onClick={() => handleDecreaseQuantity(item._id)}
                      >
                        -
                      </button>
                      <span className="quantity-display">
                        {cartItems[item._id]}
                      </span>
                      <button
                        className="quantity-btn increase"
                        onClick={() => handleIncreaseQuantity(item._id)}
                      >
                        +
                      </button>
                    </div>
                    <p className="cart-item-total">
                      ${item.price * cartItems[item._id]}
                    </p>
                    <p
                      onClick={() => handleDeleteClick(item._id)}
                      className="cross"
                      title="Xóa sản phẩm"
                    >
                      x
                    </p>
                  </div>
                  <hr />
                </div>
              );
            }
            return null;
          })
        )}
      </div>

      {/* Cart Bottom - Chỉ hiển thị nếu không rỗng */}
      {!isCartEmpty && (
        <div className="cart-bottom">
          <div className="cart-total">
            <h2>Cart Totals</h2>
            <div>
              <div className="cart-total-details">
                <p>Subtotal</p>
                <p>${getTotalCartAmount()}</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <p>Delivery Fee</p>
                <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <b>Total</b>
                <b>
                  ${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}
                </b>
              </div>
            </div>
            <button onClick={() => navigate("/placeorder")}>
              PROCEED TO CHECKOUT
            </button>
          </div>
          <div className="cart-promocode">
            <div>
              <p>If you have a promo code, Enter it here</p>
              <div className="cart-promocode-input">
                <input type="text" placeholder="promo code" />
                <button>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
