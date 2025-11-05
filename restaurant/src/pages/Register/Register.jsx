import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    restaurantName: "",
    address: "",
    phone: "",
    email: "",
    password: "",
  });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Thêm role vào formData
      const registerData = { ...formData, role: "restaurant_owner" };
      const response = await register(registerData); // Giả sử register return response

      if (response.success) {
        toast.success("Registration successful! Please login to continue.");
        navigate("/login");
      } else {
        toast.error(response.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Error during registration. Please try again.");
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Register Restaurant Account</h2>
        <input
          type="text"
          name="restaurantName"
          placeholder="Restaurant Name"
          value={formData.restaurantName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 8 chars)"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
        />
        <button type="submit">Register</button>
        <p>
          Already have an account?{" "}
          <a href="/login" onClick={() => navigate("/login")}>
            Login here
          </a>
        </p>
      </form>
    </div>
  );
};

export default Register;
