// admin/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const fetchUserInfo = async (token) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const fetchedUser = data.user;
        fetchedUser.walletBalance = fetchedUser.balance || 0;
        setUser(fetchedUser);
        localStorage.setItem("userRole", fetchedUser.role);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchUserInfo(token);
    else setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${apiUrl}/api/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role);
      await fetchUserInfo(data.token);
      navigate("/");
    } else {
      throw new Error(data.message || "Login failed");
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, fetchUserInfo }}
    >
      {children}
    </AuthContext.Provider>
  );
};
