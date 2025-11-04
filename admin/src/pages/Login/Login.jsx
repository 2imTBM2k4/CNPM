import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = ({ url }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      console.log("Attempting login:", email);

      const response = await axios.post(`${url}/api/user/login`, {
        email,
        password,
      });

      console.log("Login response:", response.data);

      if (response.data.success) {
        const role = response.data.role;

        console.log("User role:", role);

        if (role !== "admin") {
          toast.error(
            `Access Denied! Your role: ${
              role || "undefined"
            }. Admin access required.`
          );
          setLoading(false);
          return;
        }

        // Lưu token và role
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", role);

        console.log("Login successful! Redirecting...");
        toast.success("Login successful!");

        // Navigate và reload để trigger useEffect
        setTimeout(() => {
          navigate("/");
          window.location.reload();
        }, 500);
      } else {
        toast.error(response.data.message || "Login failed");
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Login error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form onSubmit={onSubmitHandler} className="login-form">
        <h2>Admin Login</h2>
        <div className="form-group">
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="Email"
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder="Password"
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading} className="login-btn">
          {loading ? "LOGGING IN..." : "LOGIN"}
        </button>
        <div className="login-hint">
          <p>Default Admin Credentials:</p>
          <p>
            <strong>Email:</strong> admin@hangry.com
          </p>
          <p>
            <strong>Password:</strong> admin123
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
