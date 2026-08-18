import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Store } from "lucide-react";
import "./RestaurantsPage.css";
import useNearbyRestaurants from "../../hooks/useNearbyRestaurants";
import RestaurantItem from "../../components/RestaurantItem/RestaurantItem";
import Reveal from "../../components/Reveal/Reveal";
import { EmptyState } from "../../../../shared/components/StateBlock";
import { NEARBY_RADIUS_KM } from "../../lib/distance";

/**
 * Browse restaurants that deliver here — the step between the home page and a
 * restaurant's own menu. Search and cuisine chips both narrow the same list,
 * which is already sorted nearest-first.
 */
const RestaurantsPage = () => {
  const { restaurants, categories, customer } = useNearbyRestaurants();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(
    searchParams.get("category") || "All"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");

  // Keep state in step with the URL (arriving from the home hero or strip,
  // and the back button).
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setCategory(searchParams.get("category") || "All");
  }, [searchParams]);

  const writeParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "All") next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    writeParam("q", value.trim());
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    writeParam("category", value);
  };

  const query = search.trim().toLowerCase();
  const visible = restaurants.filter((r) => {
    const matchesCategory =
      category === "All" || r.categories.includes(category);
    const matchesQuery =
      !query ||
      r.name?.toLowerCase().includes(query) ||
      r.address?.toLowerCase().includes(query) ||
      r.categories.some((c) => c.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="restaurants-page">
      <header className="restaurants-head">
        <h1 className="restaurants-title">
          {customer ? "Restaurants near you" : "Restaurants"}
        </h1>
        <p className="restaurants-sub">
          {customer
            ? `Delivering to your address, nearest first`
            : "Popular places delivering right now"}
        </p>
      </header>

      <div className="restaurants-search-wrap">
        <div className="restaurants-search">
          <Search className="restaurants-search-icon" size={20} />
          <input
            type="text"
            className="restaurants-search-input"
            placeholder="Search restaurants or cuisines…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search restaurants"
          />
          {search && (
            <button
              type="button"
              className="restaurants-search-clear"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="restaurants-catalog">
          <div className="catalog-list">
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`catalog-item ${category === cat ? "active" : ""}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="restaurants-grid">
        {visible.map((item, index) => (
          <Reveal key={item._id} delay={Math.min(index, 7) * 70}>
            <RestaurantItem
              id={item._id}
              name={item.name}
              address={item.address}
              phone={item.phone}
              image={item.image}
              distanceKm={item.distanceKm}
              etaMin={item.etaMin}
            />
          </Reveal>
        ))}
      </div>

      {visible.length === 0 && (
        <EmptyState
          icon={Store}
          title={query || category !== "All" ? "No matches" : "Nothing nearby"}
          description={
            query || category !== "All"
              ? "No restaurant here matches that. Try another search or cuisine."
              : customer
              ? `No restaurants deliver within ${NEARBY_RADIUS_KM} km of your address yet.`
              : "No restaurants are delivering right now. Please check back soon."
          }
        />
      )}
    </div>
  );
};

export default RestaurantsPage;
