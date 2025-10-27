import React, { useEffect, useContext } from 'react';  // Thêm useContext
import './Navbar.css';
import { assets } from '../../assets/assets';
import { AuthContext } from '../../context/AuthContext';  // Thêm
import { useNavigate } from 'react-router-dom';  // Thêm

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);  // Lấy user và logout
  const navigate = useNavigate();

  useEffect(() => {
    const toggle = document.getElementById('visual-toggle');

    // Function to apply the stored mode preference
    function applyModePreference() {
      const mode = localStorage.getItem('mode');
      if (mode === 'light') {
        toggle.checked = true;
        document.body.classList.add('lightcolors');
        document.getElementById('visual-toggle-button').classList.add('lightmode');
      } else {
        toggle.checked = false;
        document.body.classList.remove('lightcolors');
        document.getElementById('visual-toggle-button').classList.remove('lightmode');
      }
    }

    // Call the function to apply the mode preference on page load
    applyModePreference();

    toggle.addEventListener('change', function () {
      if (toggle.checked) {
        localStorage.setItem('mode', 'light');
        document.body.classList.add('lightcolors');
        document.getElementById('visual-toggle-button').classList.add('lightmode');
      } else {
        localStorage.setItem('mode', 'dark');
        document.body.classList.remove('lightcolors');
        document.getElementById('visual-toggle-button').classList.remove('lightmode');
      }
    });
  }, []); // Empty dependency array to run the effect only once

  // Define visualMode nếu chưa có (giả sử toggle mode)
  const visualMode = () => {
    const toggle = document.getElementById('visual-toggle');
    toggle.checked = !toggle.checked; // Toggle manually nếu cần
    toggle.dispatchEvent(new Event('change')); // Trigger change event
  };

  return (
    <div className='navbar'>  {/* Hợp nhất thành 1 div, dùng flex */}
      <img className='logo' src={assets.logo} alt="Logo" />
      
      {user ? (
        <>
          <img className='profile' src={assets.profile_image} alt="Profile" />
          <button onClick={logout} style={{ marginLeft: '10px' }}>Logout</button>
        </>
      ) : (
        <button onClick={() => navigate('/login')} style={{ marginLeft: 'auto' }}>Login</button>
      )}
      
      <label htmlFor="visual-toggle" id="visual-toggle-button" onClick={visualMode} style={{ marginLeft: '10px' }}>
        {/* SVG sun/moon giữ nguyên */}
        <input type="checkbox" className="visual-toggle" id="visual-toggle" />
      </label>
    </div>
  );
};

export default Navbar;