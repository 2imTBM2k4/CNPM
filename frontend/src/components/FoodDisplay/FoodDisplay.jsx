import React, { useContext } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);

  return (
    <div className="food-display" id="food-display">
      <h2 className="h2we">Top dishes near you</h2>
      <div className="food-display-list">
        {food_list.map((item) => { // Bỏ index nếu không dùng
          if (category === "All" || category === item.category) {
            return (
              <FoodItem
                key={item._id} // Đổi từ key={index} thành key={item._id} (tốt hơn cho React)
                id={item._id}
                name={item.name}
                description={item.description}
                price={item.price}
                image={item.image}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default FoodDisplay;