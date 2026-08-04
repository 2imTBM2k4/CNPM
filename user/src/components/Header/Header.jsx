// Header.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/food?q=${encodeURIComponent(q)}` : "/food");
  };

  return (
    <div className="header">
      <div className="header-photo" aria-hidden="true">
        <span className="header-note">Matted, not full-bleed</span>
      </div>
      <div className="header-contents">
        <h2>Hot food at your window in fifteen minutes</h2>
        <p>
          Skip the wait. Our drone fleet delivers meals from the best local
          restaurants straight to your door — fast, fresh, and contactless
          every time.
        </p>

        <form className="header-search" onSubmit={handleSearch}>
          <svg
            className="header-search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="header-search-input"
            placeholder="Search for dishes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search dishes"
          />
          <button type="submit" className="header-search-btn">
            Search
          </button>
        </form>

        <div className="header-badges">
          <span className="header-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            15 min delivery
          </span>
          <span className="header-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3z" />
              <path d="M3 9h18" />
              <path d="M9 3v18" />
            </svg>
            500+ restaurants
          </span>
          <span className="header-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            4.8 rating
          </span>
        </div>
      </div>
    </div>
  );
};

export default Header;
