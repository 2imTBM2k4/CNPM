import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./ProductDetail.css";
import { StoreContext } from "../../context/StoreContext";
import { assets } from "../../assets/assets";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { food_list, cartItems, addToCart, url, isLoadingFoods } =
    useContext(StoreContext);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [showCounter, setShowCounter] = useState(false);
  const [loading, setLoading] = useState(true); // NEW: Track detail loading
  const [error, setError] = useState(null); // NEW: Error state
  const [item, setItem] = useState(null); // NEW: Local state cho item (từ list hoặc fetch)

  // NEW: Fetch single nếu !item từ list
  const fetchSingleProduct = async () => {
    if (!id || item) return; // Đã có thì skip
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${url}/api/food/${id}`);
      const data = await res.json();
      if (data.success) {
        setItem(data.data);
      } else {
        throw new Error(data.message || "Product not found");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effect: Tìm từ list, nếu không có + không loading → fetch single
  useEffect(() => {
    if (isLoadingFoods) {
      setLoading(true); // Đợi list load
      return;
    }
    const foundItem = food_list.find((product) => product._id === id);
    if (foundItem) {
      setItem(foundItem);
      setLoading(false);
    } else if (!loading) {
      // Fallback fetch nếu list không có (hoặc list rỗng)
      fetchSingleProduct();
    } else {
      setLoading(false);
    }
  }, [food_list, id, isLoadingFoods, loading]);

  if (loading || isLoadingFoods) {
    return (
      <div className="product-detail">
        <div className="loading">Đang tải sản phẩm...</div>
      </div>
    );
  }

  if (error || (!item && !loading)) {
    return (
      <div className="product-detail">
        <h2>{error || "Sản phẩm không tồn tại!"}</h2>
        <button onClick={() => navigate("/")}>Quay về trang chủ</button>
      </div>
    );
  }

  // ... (giữ nguyên handleAddClick, handleRemoveTemp, handleConfirmAdd)

  const handleAddClick = () => {
    if (!showCounter) {
      setTempQuantity(1);
      setShowCounter(true);
    } else {
      setTempQuantity(tempQuantity + 1);
    }
  };

  const handleRemoveTemp = () => {
    if (tempQuantity > 1) {
      setTempQuantity(tempQuantity - 1);
    } else {
      setTempQuantity(1);
      setShowCounter(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (tempQuantity > 0) {
      const success = await addToCart(id, tempQuantity);
      if (success) {
        toast.success("Đã thêm vào giỏ hàng!");
      }
      setShowCounter(false);
      setTempQuantity(1);
    }
  };

  return (
    <div className="product-detail">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Quay về
      </button>
      <div className="product-detail-container">
        <div className="product-detail-image">
          <img src={item.image} alt={item.name} />
        </div>
        <div className="product-detail-info">
          <div className="product-detail-name-rating">
            <h2>{item.name}</h2>
            <img
              src={assets.rating_starts}
              alt="Rating"
              className="ratingstars"
            />
          </div>
          <p className="product-detail-desc">{item.description}</p>
          <p className="product-detail-price">${item.price}</p>
          <div className="product-detail-cart">
            {!showCounter ? (
              <img
                className="add-detail"
                onClick={handleAddClick}
                src={assets.add_icon_white}
                alt="Add to cart"
              />
            ) : (
              <div className="product-detail-counter-section">
                <div className="temp-counter">
                  <img
                    onClick={handleRemoveTemp}
                    src={assets.remove_icon_red}
                    alt="-"
                  />
                  <p className="temp-quantity">{tempQuantity}</p>
                  <img
                    onClick={handleAddClick}
                    src={assets.add_icon_green}
                    alt="+"
                  />
                </div>
                <button className="confirm-btn" onClick={handleConfirmAdd}>
                  Thêm vào giỏ hàng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
