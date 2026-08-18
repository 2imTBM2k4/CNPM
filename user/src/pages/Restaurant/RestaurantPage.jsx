import React, { useState, useEffect, useMemo, useRef, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, Star, Clock, Bike, Navigation, UtensilsCrossed, Store } from "lucide-react";
import "./RestaurantPage.css";
import { StoreContext } from "../../context/StoreContext";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import { SkeletonGrid } from "../../components/Skeleton/Skeleton";
import { EmptyState, ErrorState } from "../../../../shared/components/StateBlock";
import { assets } from "../../assets/assets";
import {
  haversineKm,
  estimateEtaMinutes,
  formatDistance,
} from "../../lib/distance";

/** Turn a category name into a DOM id we can scroll to. */
const sectionId = (category) =>
  `menu-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

const RestaurantPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { restaurant_list, url, user, fees } = useContext(StoreContext);

  const [restaurant, setRestaurant] = useState(null);
  const [restaurantFoods, setRestaurantFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const navRef = useRef(null);
  // While a click-triggered smooth scroll is in flight the observer would
  // fight the user's intent, so we freeze the spy until it settles.
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    const found = restaurant_list.find((r) => r._id === id);
    setRestaurant(found || null);
  }, [id, restaurant_list]);

  const fetchFoods = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${url}/api/food/list?restaurantId=${id}`);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        setRestaurantFoods(data.data || []);
      } else {
        throw new Error(data.message || "Could not load this menu");
      }
    } catch (err) {
      setError(err.message);
      setRestaurantFoods([]);
    } finally {
      setLoading(false);
    }
  }, [id, url]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // Categories in the order the kitchen listed them, deduplicated.
  const categories = useMemo(
    () => [...new Set(restaurantFoods.map((item) => item.category).filter(Boolean))],
    [restaurantFoods]
  );

  // One bucket of dishes per category — the page renders every section at
  // once and lets the nav scroll between them, rather than filtering.
  const sections = useMemo(
    () =>
      categories.map((category) => ({
        category,
        id: sectionId(category),
        foods: restaurantFoods.filter((item) => item.category === category),
      })),
    [categories, restaurantFoods]
  );

  useEffect(() => {
    setActiveCategory((current) =>
      current && categories.includes(current) ? current : categories[0] || null
    );
  }, [categories]);

  // Scroll-spy: highlight whichever section is under the sticky nav.
  useEffect(() => {
    if (sections.length === 0) return;

    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const category = entry.target.dataset.category;
          if (entry.isIntersecting) visible.add(category);
          else visible.delete(category);
        });

        if (isProgrammaticScroll.current) return;

        // Of everything on screen, the topmost section wins.
        const topmost = sections.find((s) => visible.has(s.category));
        if (topmost) setActiveCategory(topmost.category);
      },
      {
        // Detection line sits just below navbar + sticky category bar.
        rootMargin: "-170px 0px -65% 0px",
        threshold: 0,
      }
    );

    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [sections]);

  // Keep the active chip in view on the horizontally scrolling mobile bar.
  useEffect(() => {
    if (!activeCategory || !navRef.current) return;
    const chip = navRef.current.querySelector(`[data-chip="${activeCategory}"]`);
    if (chip?.scrollIntoView) {
      chip.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [activeCategory]);

  const handleCategoryClick = (category) => {
    const target = document.getElementById(sectionId(category));
    if (!target) return;

    setActiveCategory(category);
    isProgrammaticScroll.current = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Offset by the navbar plus the sticky bar so the heading isn't hidden.
    const offset = 158;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, reduceMotion ? 100 : 700);
  };

  const buildImgSrc = (image) => {
    if (!image) return assets.logo;
    if (image.startsWith("http")) return image;
    return `${url}${image}`;
  };

  // Real distance + delivery estimate when we know both ends' coordinates.
  const { distanceKm, etaMin } = useMemo(() => {
    const a = user?.address;
    if (
      restaurant &&
      typeof restaurant.lat === "number" &&
      typeof restaurant.lng === "number" &&
      a &&
      typeof a.lat === "number" &&
      typeof a.lng === "number"
    ) {
      const d = haversineKm(
        { lat: a.lat, lng: a.lng },
        { lat: restaurant.lat, lng: restaurant.lng }
      );
      return { distanceKm: d, etaMin: estimateEtaMinutes(d) };
    }
    return { distanceKm: null, etaMin: null };
  }, [restaurant, user]);

  const deliveryFee = fees?.deliveryFee;

  // The restaurant list may still be loading — don't call it missing yet.
  if (!restaurant && restaurant_list.length === 0) {
    return (
      <div className="restaurant-page">
        <div className="skeleton restaurant-banner-skeleton" />
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="restaurant-page">
        <EmptyState
          icon={Store}
          title="Restaurant not found"
          description="This restaurant may have closed or the link is out of date."
          actionLabel="Browse restaurants"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className="restaurant-page">
      <header className="restaurant-hero">
        <div className="restaurant-hero-image">
          <img
            src={buildImgSrc(restaurant.image)}
            alt={restaurant.name}
            onError={(e) => {
              e.target.src = assets.logo;
            }}
          />
        </div>

        <div className="restaurant-hero-card">
          <div className="restaurant-hero-top">
            <h1>{restaurant.name}</h1>
            <span className="restaurant-hero-rating">
              <Star size={14} fill="currentColor" strokeWidth={0} />
              4.8
            </span>
          </div>

          {restaurant.description && (
            <p className="restaurant-hero-desc">{restaurant.description}</p>
          )}

          <div className="restaurant-hero-meta">
            <span className="restaurant-hero-meta-item">
              <MapPin size={14} />
              {restaurant.address}
            </span>
            {restaurant.phone && (
              <span className="restaurant-hero-meta-item">
                <Phone size={14} />
                {restaurant.phone}
              </span>
            )}
            {typeof distanceKm === "number" && (
              <span className="restaurant-hero-meta-item">
                <Navigation size={14} />
                {formatDistance(distanceKm)}
              </span>
            )}
            <span className="restaurant-hero-meta-item">
              <Clock size={14} />
              {etaMin ? `${etaMin} min` : "15–25 min"}
            </span>
            <span className="restaurant-hero-meta-item">
              <Bike size={14} />
              {typeof deliveryFee === "number"
                ? `$${deliveryFee.toFixed(2)} delivery`
                : "Delivery"}
            </span>
          </div>

          {restaurant.isOpen === false && (
            <p className="restaurant-hero-closed">
              Closed right now — this restaurant isn't taking orders at the
              moment. Please check back later.
            </p>
          )}

          {restaurant.isLocked && (
            <p className="restaurant-hero-closed">
              Temporarily unavailable — this restaurant is not accepting orders
              right now.
            </p>
          )}
        </div>
      </header>

      {sections.length > 0 && restaurant.isOpen !== false && (
        <nav className="restaurant-catalog" ref={navRef} aria-label="Menu categories">
          <div className="catalog-list">
            {sections.map(({ category }) => (
              <button
                key={category}
                type="button"
                data-chip={category}
                className={`catalog-item ${activeCategory === category ? "active" : ""}`}
                aria-current={activeCategory === category ? "true" : undefined}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="restaurant-page-content">
        {loading && <SkeletonGrid count={6} />}

        {!loading && error && (
          <ErrorState
            title="Could not load this menu"
            description={error}
            onRetry={fetchFoods}
            actionLabel="Back to restaurants"
            onAction={() => navigate("/")}
          />
        )}

        {!loading && !error && restaurant.isOpen === false && (
          <EmptyState
            icon={Store}
            title="This restaurant is closed"
            description="The kitchen has paused orders for now. Browse other restaurants delivering to you."
            actionLabel="Browse restaurants"
            onAction={() => navigate("/restaurants")}
          />
        )}

        {!loading &&
          !error &&
          restaurant.isOpen !== false &&
          sections.map(({ category, id: anchor, foods }) => (
            <section
              key={category}
              id={anchor}
              data-category={category}
              className="menu-section"
            >
              <h2 className="menu-section-title">{category}</h2>
              <FoodDisplay foods={foods} category="All" restaurantId={id} />
            </section>
          ))}

        {!loading && !error && sections.length === 0 && (
          <EmptyState
            icon={UtensilsCrossed}
            title="No dishes yet"
            description="This restaurant hasn't published its menu. Check back soon."
            actionLabel="Browse restaurants"
            onAction={() => navigate("/")}
          />
        )}
      </div>
    </div>
  );
};

export default RestaurantPage;
