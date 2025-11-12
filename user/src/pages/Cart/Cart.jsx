import React, { useState, useContext, useEffect } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios"; // Import để fetch single nếu cần

const Cart = () => {
  const {
    cartItems,
    food_list,
    removeFromCart,
    removeItemFromCart,
    getTotalCartAmount,
    url,
    addToCart,
    token,
    setShowLogin,
  } = useContext(StoreContext);
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(null);
  const [confirmAction, setConfirmAction] = useState("");
  const [cartFoodItems, setCartFoodItems] = useState({}); // NEW: Local cache cho items trong cart (id → item object)
  const [loadingItems, setLoadingItems] = useState(new Set()); // NEW: Track loading per itemId

  // Helper: Fetch single food nếu !found trong food_list
  const fetchCartItem = async (itemId) => {
    if (loadingItems.has(itemId) || cartFoodItems[itemId]) return; // Skip nếu đang load hoặc đã có
    try {
      setLoadingItems((prev) => new Set([...prev, itemId]));
      const res = await axios.get(`${url}/api/food/${itemId}`);
      if (res.data.success) {
        setCartFoodItems((prev) => ({ ...prev, [itemId]: res.data.data }));
      } else {
        throw new Error(res.data.message || "Item not found");
      }
    } catch (err) {
      toast.error(`Lỗi tải món ăn: ${err.message}`);
      // Optional: Remove từ cartItems nếu invalid
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Effect: Khi cartItems thay đổi, fetch missing items
  useEffect(() => {
    const missingIds = Object.keys(cartItems)
      .filter((id) => cartItems[id] > 0)
      .filter(
        (id) => !food_list.find((f) => f._id === id) && !cartFoodItems[id]
      );
    if (missingIds.length > 0) {
      missingIds.forEach(fetchCartItem);
    }
  }, [cartItems]); // Trigger khi add/remove

  // Hàm xử lý tăng số lượng
  const handleIncreaseQuantity = async (itemId) => {
    await addToCart(itemId, 1);
  };

  // Hàm xử lý giảm số lượng
  const handleDecreaseQuantity = async (itemId) => {
    const currentQuantity = cartItems[itemId];
    if (currentQuantity > 1) {
      await removeFromCart(itemId);
    } else {
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
      await removeItemFromCart(itemId);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } else {
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

  // Helper: Lấy item object cho một id (từ food_list hoặc cartFoodItems)
  const getItemForCart = (itemId) => {
    return food_list.find((f) => f._id === itemId) || cartFoodItems[itemId];
  };

  // Helper: Lấy image URL
  const getImageUrl = (item) => {
    if (!item?.image) return "/placeholder.png";
    return item.image.startsWith("http")
      ? item.image
      : `${url}/images/${item.image}`;
  };

  // Items để render: Chỉ những có qty > 0
  const cartItemIds = Object.keys(cartItems).filter((id) => cartItems[id] > 0);

  // Tính tổng dựa trên cùng nguồn dữ liệu hiển thị (food_list + cartFoodItems)
  const cartTotalAmount = cartItemIds.reduce((sum, id) => {
    const item = getItemForCart(id);
    const price = item?.price || 0;
    return sum + price * (cartItems[id] || 0);
  }, 0);

  const handleProceedCheckout = () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      setShowLogin(true);
      return;
    }
    if (cartTotalAmount === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    navigate("/placeorder");
  };

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
        {cartItemIds.length === 0 ? (
          <div className="empty-cart-message">
            <p>Giỏ hàng của bạn đang trống</p>
          </div>
        ) : (
          cartItemIds.map((itemId) => {
            const item = getItemForCart(itemId);
            const isLoading = loadingItems.has(itemId);

            if (isLoading) {
              // Skeleton loading cho item
              return (
                <div key={itemId} className="cart-items-item loading-skeleton">
                  <div className="cart-item-image">
                    <div className="skeleton"></div>
                  </div>
                  <p className="skeleton"></p>
                  <p className="skeleton"></p>
                  <div className="quantity-controls">
                    <span className="skeleton"></span>
                  </div>
                  <p className="skeleton"></p>
                  <p className="skeleton"></p>
                  <hr />
                </div>
              );
            }

            if (!item) {
              // Fallback nếu fetch fail (hiếm)
              return (
                <div key={itemId} className="cart-items-item error-item">
                  <p>Lỗi tải món ăn ID: {itemId}</p>
                  <button onClick={() => handleDeleteClick(itemId)}>Xóa</button>
                  <hr />
                </div>
              );
            }

            const imageUrl = getImageUrl(item);

            return (
              <div key={itemId}>
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
                      onClick={() => handleDecreaseQuantity(itemId)}
                    >
                      -
                    </button>
                    <span className="quantity-display">
                      {cartItems[itemId]}
                    </span>
                    <button
                      className="quantity-btn increase"
                      onClick={() => handleIncreaseQuantity(itemId)}
                    >
                      +
                    </button>
                  </div>
                  <p className="cart-item-total">
                    ${item.price * cartItems[itemId]}
                  </p>
                  <p
                    onClick={() => handleDeleteClick(itemId)}
                    className="cross"
                    title="Xóa sản phẩm"
                  >
                    x
                  </p>
                </div>
                <hr />
              </div>
            );
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
                <p>${cartTotalAmount}</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <p>Delivery Fee</p>
                <p>${cartTotalAmount === 0 ? 0 : 2}</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <b>Total</b>
                <b>${cartTotalAmount === 0 ? 0 : cartTotalAmount + 2}</b>
              </div>
            </div>
            <button onClick={handleProceedCheckout}>PROCEED TO CHECKOUT</button>
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
