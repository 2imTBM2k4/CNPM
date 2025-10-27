import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantItem.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';  // Giả sử có placeholder

const RestaurantItem = ({ id, name, address, phone, image }) => {
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/restaurant/${id}`);
  };

  // Sửa: Dùng ${url}${image} vì image đã có prefix /images/restaurants/
  const imgSrc = image ? `${url}${image}` : assets.logo;

  return (
    <div className="restaurant-item" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="restaurant-item-img-container">
        <img
          className="restaurant-item-image"
          src={imgSrc}
          alt={name}
          onError={(e) => {  // Thêm fallback nếu load lỗi
            e.target.src = assets.logo;
          }}
        />
      </div>
      <div className="restaurant-item-info">
        <p className="restaurant-name">{name}</p>
        <p className="restaurant-address">{address}</p>
        <p className="restaurant-phone">{phone || 'Không có số điện thoại'}</p>
      </div>
    </div>
  );
};

export default RestaurantItem;