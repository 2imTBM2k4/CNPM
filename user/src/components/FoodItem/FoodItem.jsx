import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

function FoodItem({ id, name, price, description, image }) {
  const { cartItems, addToCart, url } = useContext(StoreContext);
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
        toast.success("Đã thêm vào giỏ hàng!");
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
    <div className="food-item" onClick={handleItemClick} style={{ cursor: 'pointer' }}>
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
          <img
            className="add"
            onClick={handleAddClick}
            src={assets.add_icon_white}
            alt="Add to cart"
          />
        )}
        {showCounter && (
          <div className="temp-add-wrapper">
            <div className="temp-counter">
              <img onClick={handleRemoveTemp} src={assets.remove_icon_red} alt="-" />
              <p className="temp-quantity">{tempQuantity}</p>
              <img onClick={handleAddClick} src={assets.add_icon_green} alt="+" />
            </div>
            <button className="confirm-btn" onClick={handleConfirmAdd}>
              Thêm vào giỏ hàng
            </button>
          </div>
        )}
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p className="namewe">{name}</p>
          <img className="ratingstars" src={assets.rating_starts} alt="" />
        </div>
        <p className="food-item-desc">{description}</p>
        <p className="food-item-price">${price}</p>
      </div>
    </div>
  );
}

export default FoodItem;