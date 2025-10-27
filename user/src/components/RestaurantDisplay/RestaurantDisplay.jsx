import React, { useContext } from 'react';
import './RestaurantDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import RestaurantItem from '../RestaurantItem/RestaurantItem';

const RestaurantDisplay = () => {
  const { restaurant_list } = useContext(StoreContext);

  return (
    <div className="restaurant-display" id="restaurant-display">
      <div className="restaurant-display-list">
        {restaurant_list.map((item) => (
          <RestaurantItem
            key={item._id}
            id={item._id}
            name={item.name}
            address={item.address}
            phone={item.phone}
            image={item.image}  // Nếu có, else placeholder ở component
          />
        ))}
        {restaurant_list.length === 0 && (
          <div className="no-items-message">
            <p>Không có nhà hàng nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDisplay;