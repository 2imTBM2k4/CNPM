import React, { useContext } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category = "All", restaurantId, foods = [] }) => {
  const { food_list } = useContext(StoreContext);

  let displayItems = [];
  if (foods.length > 0) {
    displayItems = foods.filter(
      (item) => category === "All" || item.category === category
    );
  } else {
    const restaurantFoods = food_list.filter(
      (item) => !restaurantId || item.restaurantId === restaurantId
    );
    if (category === "All") {
      displayItems = restaurantFoods;
    } else {
      displayItems = restaurantFoods.filter(
        (item) => category === item.category
      );
    }
  }

  return (
    <div className="food-display" id="food-display">
      <div className="food-display-list">
        {displayItems.map((item) => (
          <FoodItem
            key={item._id}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
          />
        ))}
        {displayItems.length === 0 && (
          <div className="no-items-message">
            <p>No items found in this category.</p>
            {restaurantId && <p>(Showing items from this restaurant only)</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
