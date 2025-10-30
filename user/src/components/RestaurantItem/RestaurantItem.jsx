import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantItem.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';

const RestaurantItem = ({ id, name, address, phone, image }) => {
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/restaurant/${id}`);
  };

  // Sửa: Xử lý src img - nếu full URL (Cloudinary), dùng trực tiếp; else prefix local
  const getImgSrc = (img) => {
    if (!img) return assets.logo;
    return img.startsWith('http') ? img : `${url}${img}`;  // url + image (nếu local có prefix /images/...)
  };

  const imgSrc = getImgSrc(image);

  return (
    <div className="restaurant-item" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="restaurant-item-img-container">
        <img
          className="restaurant-item-image"
          src={imgSrc}
          alt={name}
          onError={(e) => {  // Fallback nếu load lỗi
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