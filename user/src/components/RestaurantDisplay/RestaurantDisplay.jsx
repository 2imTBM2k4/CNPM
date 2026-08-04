import React, { useContext } from 'react';
import { Store } from 'lucide-react';
import './RestaurantDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import RestaurantItem from '../RestaurantItem/RestaurantItem';
import Reveal from '../Reveal/Reveal';
import { SkeletonGrid } from '../Skeleton/Skeleton';
import { EmptyState, ErrorState } from '../../../../shared/components/StateBlock';

const RestaurantDisplay = () => {
  const {
    restaurant_list,
    isLoadingRestaurants,
    restaurantError,
    fetchRestaurantList,
  } = useContext(StoreContext);

  if (isLoadingRestaurants) {
    return (
      <div className="restaurant-display" id="restaurant-display">
        <SkeletonGrid count={6} variant="restaurant" />
      </div>
    );
  }

  if (restaurantError) {
    return (
      <div className="restaurant-display" id="restaurant-display">
        <ErrorState
          title="Could not load restaurants"
          description={restaurantError}
          onRetry={fetchRestaurantList}
        />
      </div>
    );
  }

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
              image={item.image}
            />
          </Reveal>
        ))}
        {restaurant_list.length === 0 && (
          <EmptyState
            icon={Store}
            title="No restaurants yet"
            description="No restaurants are delivering right now. Please check back soon."
          />
        )}
      </div>
    </div>
  );
};

export default RestaurantDisplay;
