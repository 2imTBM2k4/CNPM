import React, { useEffect, useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const toggle = document.getElementById("visual-toggle");

    function applyModePreference() {
      const mode = localStorage.getItem("mode");
      if (mode === "light") {
        toggle.checked = true;
        document.body.classList.add("lightcolors");
        document
          .getElementById("visual-toggle-button")
          .classList.add("lightmode");
      } else {
        toggle.checked = false;
        document.body.classList.remove("lightcolors");
        document
          .getElementById("visual-toggle-button")
          .classList.remove("lightmode");
      }
    }

    applyModePreference();

    toggle.addEventListener("change", function () {
      if (toggle.checked) {
        localStorage.setItem("mode", "light");
        document.body.classList.add("lightcolors");
        document
          .getElementById("visual-toggle-button")
          .classList.add("lightmode");
      } else {
        localStorage.setItem("mode", "dark");
        document.body.classList.remove("lightcolors");
        document
          .getElementById("visual-toggle-button")
          .classList.remove("lightmode");
      }
    });
  }, []);

  const visualMode = () => {
    const toggle = document.getElementById("visual-toggle");
    toggle.checked = !toggle.checked;
    toggle.dispatchEvent(new Event("change"));
  };

  return (
    <div className="navbar">
      <img className="logo" src={assets.logo} alt="Logo" />

      {user ? (
        <>
          <span className="balance">
            Balance: ${user.walletBalance?.toFixed(2) || "0.00"}
          </span>{" "}
          <img className="profile" src={assets.profile_image} alt="Profile" />
          <button onClick={logout} style={{ marginLeft: "10px" }}>
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={() => navigate("/login")}
          style={{ marginLeft: "auto" }}
        >
          Login
        </button>
      )}

      <label
        htmlFor="visual-toggle"
        id="visual-toggle-button"
        onClick={visualMode}
        style={{ marginLeft: "10px" }}
      >
        <input type="checkbox" className="visual-toggle" id="visual-toggle" />
      </label>
    </div>
  );
};

export default Navbar;
