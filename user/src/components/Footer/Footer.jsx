import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <span className="footer-logo">Drone Delivery</span>
          <p>Fast, reliable drone-powered food delivery straight to your door.</p>
          <div className="footer-social-icons">
            <a href="#" aria-label="Facebook"><img src={assets.facebook_icon} alt="Facebook" /></a>
            <a href="#" aria-label="Twitter"><img src={assets.twitter_icon} alt="Twitter" /></a>
            <a href="#" aria-label="LinkedIn"><img src={assets.linkedin_icon} alt="LinkedIn" /></a>
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/food">Menu</Link></li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>support@dronedelivery.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright {new Date().getFullYear()} &copy; Drone Delivery - All rights reserved.
      </p>
    </div>
  );
};

export default Footer;
