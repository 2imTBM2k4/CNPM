// import React, { useState, useEffect, useContext } from 'react';
// import { useParams } from 'react-router-dom';
// import './RestaurantPage.css';
// import { StoreContext } from '../../context/StoreContext';
// import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
// import { assets } from '../../assets/assets';  // Import để fallback

// const RestaurantPage = () => {
//   const { id } = useParams();
//   const { restaurant_list, food_list, url } = useContext(StoreContext);  // Thêm url
//   const [category, setCategory] = useState("All");
//   const [restaurant, setRestaurant] = useState(null);

//   // Tìm restaurant từ list
//   useEffect(() => {
//     const found = restaurant_list.find((r) => r._id === id);
//     setRestaurant(found);
//   }, [id, restaurant_list]);

//   if (!restaurant) {
//     return <div>Nhà hàng không tồn tại.</div>;
//   }

//   // SỬA: Xử lý URL ảnh động - kiểm tra full URL hay path local (với prefix /images/ đã có trong DB)
//   const buildImgSrc = (image) => {
//     if (!image) return assets.logo;
//     if (image.startsWith('http')) {
//       return image;  // Full URL từ Cloudinary, dùng trực tiếp
//     }
//     return `${url}${image}`;  // Path local đã có /images/... , chỉ prepend url
//   };
//   const imgSrc = buildImgSrc(restaurant.image);

//   // Lấy categories duy nhất từ food_list filter by restaurantId
//   const filteredFoods = food_list.filter((item) => item.restaurantId === id);
//   const categories = ["All", ...new Set(filteredFoods.map((item) => item.category).filter(Boolean))];

//   return (
//     <div className="restaurant-page">
//       {/* Info restaurant - Thêm layout flex với ảnh bên trái */}
//       <div className="restaurant-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
//         {/* Ảnh quán */}
//         <div className="restaurant-image-container" style={{ flexShrink: 0 }}>
//           <img
//             src={imgSrc}
//             alt={restaurant.name}
//             style={{
//               width: '200px',
//               height: '150px',
//               objectFit: 'cover',
//               borderRadius: '8px'
//             }}
//             onError={(e) => {  // Fallback nếu lỗi
//               e.target.src = assets.logo;
//             }}
//           />
//         </div>

//         {/* Text info bên phải */}
//         <div className="restaurant-text-info" style={{ flex: 1 }}>
//           <h1>{restaurant.name}</h1>
//           <p>Địa chỉ: {restaurant.address}</p>
//           <p>Số điện thoại: {restaurant.phone || 'Không có'}</p>
//           <p>Mô tả: {restaurant.description || 'Không có mô tả'}</p>
//         </div>
//       </div>

//       {/* Catalog/Filter Section */}
//       <div className="restaurant-catalog">
//         <div className="catalog-list">
//           {categories.map((cat, index) => (
//             <button
//               key={index}
//               className={`catalog-item ${category === cat ? 'active' : ''}`}
//               onClick={() => setCategory(cat)}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Food Display Section */}
//       <div className="restaurant-page-content">
//         <FoodDisplay category={category} restaurantId={id} />  {/* Truyền restaurantId */}
//       </div>
//     </div>
//   );
// };

// export default RestaurantPage;

import React, { useState, useEffect, useMemo, useContext } from "react";
import { useParams } from "react-router-dom";
import "./RestaurantPage.css";
import { StoreContext } from "../../context/StoreContext";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import { assets } from "../../assets/assets";

const RestaurantPage = () => {
  const { id } = useParams();
  const { restaurant_list, url } = useContext(StoreContext); // Hook 1: useContext
  const [category, setCategory] = useState("All"); // Hook 2: useState
  const [restaurant, setRestaurant] = useState(null); // Hook 3: useState
  const [restaurantFoods, setRestaurantFoods] = useState([]); // Hook 4: useState
  const [loading, setLoading] = useState(true); // Hook 5: useState
  const [error, setError] = useState(null); // Hook 6: useState

  // Hook 7: useEffect - Tìm restaurant
  useEffect(() => {
    const found = restaurant_list.find((r) => r._id === id);
    setRestaurant(found);
  }, [id, restaurant_list]);

  // Hook 8: useEffect - Fetch foods
  useEffect(() => {
    if (id && restaurant) {
      setLoading(true);
      setError(null);
      fetch(`${url}/api/food/list?restaurantId=${id}`)
        .then((response) => {
          console.log("Fetch response status:", response.status);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Fetch data:", data);
          if (data.success && data.data) {
            setRestaurantFoods(data.data);
            console.log("Set restaurantFoods:", data.data.length);
          } else {
            setError("No foods found");
          }
        })
        .catch((err) => {
          console.error("Fetch restaurant foods error:", err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [id, restaurant, url]);

  // Hook 9: useMemo - Categories (top level, dependency restaurantFoods)
  const categories = useMemo(() => {
    const cats = [
      "All",
      ...new Set(restaurantFoods.map((item) => item.category).filter(Boolean)),
    ];
    console.log("Computed categories:", cats); // DEBUG
    return cats;
  }, [restaurantFoods]);

  // Hook 10: useMemo - Filtered foods (top level, dependency restaurantFoods + category)
  const filteredFoods = useMemo(() => {
    const filtered = restaurantFoods.filter(
      (item) => category === "All" || item.category === category
    );
    return filtered;
  }, [restaurantFoods, category]);

  // Conditional renders sau tất cả hooks
  if (!restaurant) {
    return <div>Nhà hàng không tồn tại.</div>;
  }

  if (loading) {
    return <div>Đang tải món ăn...</div>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  const buildImgSrc = (image) => {
    if (!image) return assets.logo;
    if (image.startsWith("http")) return image;
    return `${url}${image}`;
  };
  const imgSrc = buildImgSrc(restaurant.image);

  return (
    <div className="restaurant-page">
      <div
        className="restaurant-info"
        style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}
      >
        <div className="restaurant-image-container" style={{ flexShrink: 0 }}>
          <img
            src={imgSrc}
            alt={restaurant.name}
            style={{
              width: "200px",
              height: "150px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
            onError={(e) => {
              e.target.src = assets.logo;
            }}
          />
        </div>
        <div className="restaurant-text-info" style={{ flex: 1 }}>
          <h1>{restaurant.name}</h1>
          <p>Địa chỉ: {restaurant.address}</p>
          <p>Số điện thoại: {restaurant.phone || "Không có"}</p>
          <p>Mô tả: {restaurant.description || "Không có mô tả"}</p>
        </div>
      </div>

      <div className="restaurant-catalog">
        <div className="catalog-list">
          {categories.map((cat, index) => (
            <button
              key={index}
              className={`catalog-item ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="restaurant-page-content">
        <FoodDisplay
          foods={filteredFoods}
          category={category}
          restaurantId={id}
        />
      </div>
    </div>
  );
};

export default RestaurantPage;
