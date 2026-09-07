import React, { useContext, useState } from 'react';
import { Plus, Star, Settings2 } from 'lucide-react';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import ItemOptionsSheet from '../ItemOptionsSheet/ItemOptionsSheet';
import { formatVND } from "../../../../shared/utils/money";

function FoodItem({ id, name, price, description, image, optionGroups = [] }) {
  const { url, food_list } = useContext(StoreContext);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The sheet needs the whole dish. Props cover the common case; fall back to
  // the global list when a caller passed only the summary fields.
  const item = {
    _id: id,
    name,
    price,
    description,
    image,
    optionGroups:
      optionGroups.length > 0
        ? optionGroups
        : food_list.find((f) => f._id === id)?.optionGroups || [],
  };

  const hasOptions = item.optionGroups.length > 0;

  // Sửa: Xử lý src img - nếu full URL (Cloudinary), dùng trực tiếp; else prefix local
  const getImgSrc = (img) => {
    if (!img) return assets.sample_food || assets.logo; // Placeholder nếu null
    return img.startsWith('http') ? img : `${url}/images/${img}`;
  };

  const imgSrc = getImgSrc(image);

  return (
    <>
      <div
        className="food-item"
        onClick={() => setSheetOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSheetOpen(true);
          }
        }}
      >
        <div className="food-item-img-container">
          <img
            className="food-item-image"
            src={imgSrc}
            alt={name}
            onError={(e) => {  // Fallback nếu load lỗi
              e.target.src = assets.sample_food || assets.logo;
            }}
          />
          <button
            className="food-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSheetOpen(true);
            }}
            aria-label={
              hasOptions ? `Choose options for ${name}` : `Add ${name} to cart`
            }
          >
            {hasOptions ? (
              <Settings2 size={18} strokeWidth={2.2} />
            ) : (
              <Plus size={20} strokeWidth={2.5} />
            )}
          </button>
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
          <div className="food-item-footer">
            <p className="food-item-price">{formatVND(price)}</p>
            {hasOptions && <span className="ds-label">Customisable</span>}
          </div>
        </div>
      </div>

      {sheetOpen && (
        <ItemOptionsSheet item={item} onClose={() => setSheetOpen(false)} />
      )}
    </>
  );
}

export default FoodItem;
