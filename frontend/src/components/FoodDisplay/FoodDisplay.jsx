import React, { useContext } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);

  // Lấy danh sách món ăn để hiển thị
  const getDisplayItems = () => {
    if (category === "All") {
      return food_list;
    }
    return food_list.filter(item => category === item.category);
  };

  const displayItems = getDisplayItems();

  return (
    <div className="food-display" id="food-display">
      {/* Đã xóa tiêu đề */}
      <div className="food-display-list">
        {displayItems.map((item) => {
          return (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
            />
          );
        })}
        {displayItems.length === 0 && (
          <div className="no-items-message">
            <p>Không có món ăn nào trong danh mục này.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;