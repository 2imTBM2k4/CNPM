import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import './FoodPage.css';
import { StoreContext } from '../../context/StoreContext';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';

const FoodPage = () => {
  const { food_list } = useContext(StoreContext);
  const [category, setCategory] = useState("All");
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");

  // Keep the input in sync when the URL query changes (e.g. arriving from the
  // home hero search, or the browser back button).
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearchChange = (value) => {
    setSearch(value);
    // Mirror the query into the URL so the search is shareable and survives
    // a refresh, without pushing a new history entry per keystroke.
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  // Lấy tất cả categories duy nhất từ food_list
  const categories = ["All", ...new Set(food_list.map(item => item.category).filter(Boolean))];

  return (
    <div className="food-page">
      {/* Search bar */}
      <div className="food-search-wrap">
        <div className="food-search">
          <Search className="food-search-icon" size={20} />
          <input
            type="text"
            className="food-search-input"
            placeholder="Search dishes by name or description..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search dishes"
          />
          {search && (
            <button
              type="button"
              className="food-search-clear"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

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
        <FoodDisplay category={category} searchQuery={search} />
      </div>
    </div>
  );
};

export default FoodPage;