import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserInfo(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/user/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "User info endpoint not found - Check backend routes"
          );
        } else if (response.status === 401) {
          throw new Error("Unauthorized - Invalid token");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response not JSON - Likely server error page");
      }
      const data = await response.json();
      if (data.success) {
        let fetchedUser = data.user;
        if (!fetchedUser) {
          throw new Error("User data is missing in response");
        }
        if (
          fetchedUser.restaurantId &&
          typeof fetchedUser.restaurantId === "object"
        ) {
          fetchedUser.restaurantId =
            fetchedUser.restaurantId._id || fetchedUser.restaurantId.toString();
        }

        // Fetch balance tùy role với debug logs
        if (fetchedUser.role === "admin") {
          fetchedUser.walletBalance = fetchedUser.balance || 0;
          console.log("Admin balance:", fetchedUser.walletBalance);
        } else if (
          fetchedUser.role === "restaurant_owner" &&
          fetchedUser.restaurantId
        ) {
          console.log(
            "Fetching restaurant data for ID:",
            fetchedUser.restaurantId
          );
          const restaurantResponse = await fetch(
            `${apiUrl}/api/restaurant/${fetchedUser.restaurantId}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Restaurant API status:", restaurantResponse.status);
          if (restaurantResponse.ok) {
            const restaurantData = await restaurantResponse.json();
            console.log("Restaurant data received:", restaurantData);
            if (restaurantData.success && restaurantData.data) {
              fetchedUser.walletBalance = restaurantData.data.balance || 0;
              console.log(
                "Restaurant balance set to:",
                fetchedUser.walletBalance
              );
            } else {
              fetchedUser.walletBalance = 0;
              console.warn(
                "Failed to fetch valid restaurant data:",
                restaurantData
              );
            }
          } else {
            fetchedUser.walletBalance = 0;
            console.warn(
              "Restaurant API response not OK:",
              restaurantResponse.status
            );
          }
        } else {
          fetchedUser.walletBalance = 0;
          console.log("No balance for this role.");
        }

        setUser(fetchedUser);
        if (fetchedUser.restaurantId) {
          localStorage.setItem("restaurantId", fetchedUser.restaurantId);
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("restaurantId");
      }
    } catch (error) {
      console.error("Fetch user info error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("restaurantId");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        await fetchUserInfo(data.token);
        navigate("/list");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error during login");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "restaurant_owner",
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Không set token, không fetchUserInfo, không navigate('/list')
        return data; // Return để Register.jsx xử lý toast & navigate('/login')
      } else {
        throw new Error(data.message || "Register failed");
      }
    } catch (error) {
      console.error(error);
      throw new Error("Error during register");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("restaurantId");
    setUser(null);
    setIsLoading(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
