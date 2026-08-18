import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, ArrowRight, Bike } from 'lucide-react';
import './RestaurantItem.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { formatDistance } from '../../lib/distance';

const RestaurantItem = ({ id, name, address, phone, image, distanceKm, etaMin }) => {
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
    <div className="restaurant-item" onClick={handleClick}>
      <div className="restaurant-item-img-container">
        <img
          className="restaurant-item-image"
          src={imgSrc}
          alt={name}
          onError={(e) => {  // Fallback nếu load lỗi
            e.target.src = assets.logo;
          }}
        />
        <span className="restaurant-eta-badge">
          <Clock size={13} />
          {etaMin ? `${etaMin} min` : '15 min'}
        </span>
        <span className="restaurant-open-badge">Open</span>
      </div>
      <div className="restaurant-item-info">
        <div className="restaurant-name-row">
          <p className="restaurant-name">{name}</p>
          <span className="restaurant-rating">
            <Star size={13} fill="currentColor" strokeWidth={0} />
            4.8
          </span>
        </div>
        {typeof distanceKm === 'number' && (
          <p className="restaurant-delivery-meta">
            <Bike size={14} className="restaurant-meta-icon" />
            <span>{formatDistance(distanceKm)}</span>
            <span className="restaurant-meta-dot">·</span>
            <span>{etaMin} min delivery</span>
          </p>
        )}
        <p className="restaurant-address">
          <MapPin size={14} className="restaurant-meta-icon" />
          <span>{address}</span>
        </p>
        <p className="restaurant-phone">
          <Phone size={14} className="restaurant-meta-icon" />
          <span>{phone || 'No phone number'}</span>
        </p>
        <div className="restaurant-view-menu">
          View menu
          <ArrowRight size={15} />
        </div>
      </div>
    </div>
  );
};

export default RestaurantItem;
