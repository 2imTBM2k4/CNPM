// import React, { useContext } from 'react';
// import './FoodDisplay.css';
// import { StoreContext } from '../../context/StoreContext';
// import FoodItem from '../FoodItem/FoodItem';

// const FoodDisplay = ({ category }) => {
//   const { food_list } = useContext(StoreContext);

//   // Lấy danh sách món ăn để hiển thị
//   const getDisplayItems = () => {
//     if (category === "All") {
//       return food_list;
//     }
//     return food_list.filter(item => category === item.category);
//   };

//   const displayItems = getDisplayItems();

//   return (
//     <div className="food-display" id="food-display">
//       {/* Đã xóa tiêu đề */}
//       <div className="food-display-list">
//         {displayItems.map((item) => {
//           return (
//             <FoodItem
//               key={item._id}
//               id={item._id}
//               name={item.name}
//               description={item.description}
//               price={item.price}
//               image={item.image}
//             />
//           );
//         })}
//         {displayItems.length === 0 && (
//           <div className="no-items-message">
//             <p>Không có món ăn nào trong danh mục này.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FoodDisplay;

// import React, { useContext } from 'react';
// import './FoodDisplay.css';
// import { StoreContext } from '../../context/StoreContext';
// import FoodItem from '../FoodItem/FoodItem';

// const FoodDisplay = ({ category, restaurantId }) => {  // Thêm restaurantId vào props
//   const { food_list } = useContext(StoreContext);

//   // Lấy danh sách món ăn để hiển thị: Filter theo restaurantId trước, rồi theo category
//   const getDisplayItems = () => {
//     // Bước 1: Filter theo restaurantId (chỉ món của nhà hàng hiện tại)
//     const restaurantFoods = food_list.filter(item => item.restaurantId === restaurantId);

//     // Bước 2: Filter theo category trên danh sách đã filter
//     if (category === "All") {
//       return restaurantFoods;
//     }
//     return restaurantFoods.filter(item => category === item.category);
//   };

//   const displayItems = getDisplayItems();

//   return (
//     <div className="food-display" id="food-display">
//       {/* Đã xóa tiêu đề */}
//       <div className="food-display-list">
//         {displayItems.map((item) => {
//           return (
//             <FoodItem
//               key={item._id}
//               id={item._id}
//               name={item.name}
//               description={item.description}
//               price={item.price}
//               image={item.image}
//             />
//           );
//         })}
//         {displayItems.length === 0 && (
//           <div className="no-items-message">
//             <p>Không có món ăn nào trong danh mục này.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FoodDisplay;

import React, { useContext, useEffect } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category = "All", restaurantId, foods = [] }) => {
  // Nhận thêm prop foods (mảng món từ parent)
  const { food_list } = useContext(StoreContext);

  // DEBUG: Log props để trace (xóa sau khi OK)
  useEffect(() => {
    console.log("FoodDisplay render:", {
      foodsLength: foods.length, // Từ prop (RestaurantPage)
      category,
      restaurantId,
      globalFoodListLength: food_list.length,
    });
  }, [foods, category, restaurantId]);

  // Ưu tiên prop foods nếu có (RestaurantPage: đã fetch/filter riêng)
  let displayItems = [];
  if (foods.length > 0) {
    // Filter theo category trên prop foods (nếu cần, nhưng RestaurantPage đã filter)
    displayItems = foods.filter(
      (item) => category === "All" || item.category === category
    );
  } else {
    // Fallback global: Filter food_list theo restaurantId + category (cho FoodPage)
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

  console.log("FoodDisplay - Display items count:", displayItems.length); // DEBUG: Check kết quả filter

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
            <p>Không có món ăn nào trong danh mục này.</p>
            {restaurantId && <p>(Chỉ món của nhà hàng này)</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
