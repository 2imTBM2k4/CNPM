import React from 'react';
import './Home.css';
import Header from '../../components/Header/Header';
import AppDownload from '../../components/AppDownload/AppDownload';
import RestaurantDisplay from '../../components/RestaurantDisplay/RestaurantDisplay';
import Reveal from '../../components/Reveal/Reveal';

const Home = () => {
  return (
    <div>
      <Header />

      <section className="home-section container">
        <div className="home-section-head">
          <Reveal as="h2" className="home-section-title">
            Restaurants near you
          </Reveal>
          <p className="home-section-sub">
            Popular spots delivering to your area right now
          </p>
        </div>
        <RestaurantDisplay />
      </section>

      <Reveal>
        <AppDownload />
      </Reveal>
    </div>
  );
};

export default Home;
