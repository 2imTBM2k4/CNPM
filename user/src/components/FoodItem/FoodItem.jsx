import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Minus, Star } from 'lucide-react';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

function FoodItem({ id, name, price, description, image }) {
  const { addToCart, url } = useContext(StoreContext);
  const navigate = useNavigate();
  const [tempQuantity, setTempQuantity] = useState(0);
  const [showCounter, setShowCounter] = useState(false);

  const handleItemClick = () => {
    navigate(`/product/${id}`);
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (!showCounter) {
      setTempQuantity(1);
      setShowCounter(true); // Luôn show counter khi click add, bất kể đã có trong cart
    } else {
      setTempQuantity(tempQuantity + 1);
    }
  };

  const handleRemoveTemp = (e) => {
    e.stopPropagation();
    if (tempQuantity > 1) {
      setTempQuantity(tempQuantity - 1);
    } else {
      setTempQuantity(0);
      setShowCounter(false); // Ẩn counter
    }
  };

  // SỬA: Chỉ toast nếu addToCart return true (thành công)
  const handleConfirmAdd = async (e) => {
    e.stopPropagation();
    if (tempQuantity > 0) {
      const success = await addToCart(id, tempQuantity); // Luôn cộng dồn quantity
      if (success) {
        toast.success("Added to cart!");
      }  // Không toast nếu false (chưa login, lỗi, etc.)
      setTempQuantity(0);
      setShowCounter(false); // Ẩn counter sau confirm, hiện lại nút add
    }
  };

  // Sửa: Xử lý src img - nếu full URL (Cloudinary), dùng trực tiếp; else prefix local
  const getImgSrc = (img) => {
    if (!img) return assets.sample_food || assets.logo; // Placeholder nếu null
    return img.startsWith('http') ? img : `${url}/images/${img}`;
  };

  const imgSrc = getImgSrc(image);

  return (
    <div className="food-item" onClick={handleItemClick}>
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={imgSrc}
          alt={name}
          onError={(e) => {  // Fallback nếu load lỗi
            e.target.src = assets.sample_food || assets.logo;
          }}
        />
        {!showCounter && ( // Luôn render nút add trừ khi đang show counter
          <button
            className="food-add-btn"
            onClick={handleAddClick}
            aria-label="Add to cart"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        )}
        {showCounter && (
          <div className="temp-add-wrapper" onClick={(e) => e.stopPropagation()}>
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
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p className="namewe">{name}</p>
          <span className="food-item-rating">
            <Star size={13} fill="currentColor" strokeWidth={0} />
            4.8
          </span>
        </div>
        <p className="food-item-desc">{description}</p>
        <p className="food-item-price">${price}</p>
      </div>
    </div>
  );
}

export default FoodItem;
