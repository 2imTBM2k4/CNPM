// Header.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header = () => {
  return (
    <div className='header'>
        <div className="header-contents">
            <h2>Order your favorite food here</h2>
            <p>Choose from a diverse menu featuring a delactable array of dishes crafted with the finest ingredients and satisfy your cravings and elevate your dining experience, one delicious meal at a time.</p>
            <Link to="/food">
              <button className='buttonwl'>View Menu</button>
            </Link>
        </div>
    </div>
  )
}

export default Header