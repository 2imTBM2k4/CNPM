import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, Minus, Star, ArrowLeft } from "lucide-react";
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

  useEffect(() => {
    if (isLoadingFoods) return;
    const foundItem = food_list.find((product) => product._id === id);
    if (foundItem) {
      setItem(foundItem);
      setLoading(false);
    } else {
      fetchSingleProduct();
    }
  }, [food_list, id, isLoadingFoods]);

  if (loading || isLoadingFoods) {
    return (
      <div className="product-detail">
        <div className="loading">Loading product...</div>
      </div>
    );
  }

  if (error || (!item && !loading)) {
    return (
      <div className="product-detail">
        <h2>{error || "Product not found!"}</h2>
        <button onClick={() => navigate("/")}>Back to home</button>
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
        toast.success("Added to cart!");
      }
      setShowCounter(false);
      setTempQuantity(1);
    }
  };

  return (
    <div className="product-detail">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="product-detail-container">
        <div className="product-detail-image">
          <img src={item.image} alt={item.name} />
        </div>
        <div className="product-detail-info">
          <div className="product-detail-name-rating">
            <h2>{item.name}</h2>
            <span className="product-detail-rating">
              <Star size={15} fill="currentColor" strokeWidth={0} />
              4.8
            </span>
          </div>
          <p className="product-detail-desc">{item.description}</p>
          <p className="product-detail-price">${item.price}</p>
          <div className="product-detail-cart">
            {!showCounter ? (
              <button
                className="add-detail"
                onClick={handleAddClick}
              >
                <Plus size={18} strokeWidth={2.5} /> Add to cart
              </button>
            ) : (
              <div className="product-detail-counter-section">
                <div className="temp-counter">
                  <button className="temp-counter-btn" onClick={handleRemoveTemp} aria-label="Decrease">
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <p className="temp-quantity">{tempQuantity}</p>
                  <button className="temp-counter-btn" onClick={handleAddClick} aria-label="Increase">
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <button className="confirm-btn" onClick={handleConfirmAdd}>
                  Add to cart
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
