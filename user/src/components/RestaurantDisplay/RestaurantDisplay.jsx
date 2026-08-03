import React, { useContext } from 'react';
import './RestaurantDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import RestaurantItem from '../RestaurantItem/RestaurantItem';
import Reveal from '../Reveal/Reveal';

const RestaurantDisplay = () => {
  const { restaurant_list } = useContext(StoreContext);

  return (
    <div className="restaurant-display" id="restaurant-display">
      <div className="restaurant-display-list">
        {restaurant_list.map((item, index) => (
          <Reveal key={item._id} delay={Math.min(index, 7) * 70}>
            <RestaurantItem
              id={item._id}
              name={item.name}
              address={item.address}
              phone={item.phone}
              image={item.image}  // Nếu có, else placeholder ở component
            />
          </Reveal>
        ))}
        {restaurant_list.length === 0 && (
          <div className="no-items-message">
            <p>No restaurants available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDisplay;