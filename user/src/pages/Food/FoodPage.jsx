import React, { useState, useContext } from 'react';
import './FoodPage.css';
import { StoreContext } from '../../context/StoreContext';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';

const FoodPage = () => {
  const { food_list } = useContext(StoreContext);
  const [category, setCategory] = useState("All");

  // Lấy tất cả categories duy nhất từ food_list
  const categories = ["All", ...new Set(food_list.map(item => item.category).filter(Boolean))];

  return (
    <div className="food-page">
      {/* Catalog/Filter Section - Không có tiêu đề */}
      <div className="food-catalog">
        <div className="catalog-list">
          {categories.map((cat, index) => (
            <button
              key={index}
              className={`catalog-item ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Food Display Section */}
      <div className="food-page-content">
        <FoodDisplay category={category} />
      </div>
    </div>
  );
};

export default FoodPage;