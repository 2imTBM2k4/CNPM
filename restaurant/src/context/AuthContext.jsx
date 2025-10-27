import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo(token);  // Mới: Fetch user sau load token
    }
  }, []);

 const fetchUserInfo = async (token) => {
  try {
    const response = await fetch(`${apiUrl}/api/user/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }  // Đúng header
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User info endpoint not found - Check backend routes');
      } else if (response.status === 401) {
        throw new Error('Unauthorized - Invalid token');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    // Kiểm tra content-type trước khi json()
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response not JSON - Likely server error page');
    }
    const data = await response.json();
    if (data.success) {
      setUser(data.user);  // Full user { _id, role, restaurantId, ... }
    } else {
      throw new Error(data.message || 'Failed to fetch user info');
    }
  } catch (error) {
    console.error('Fetch user error:', error);
    alert(error.message);  // Show user-friendly alert
    logout();  // Auto logout nếu fail
  }
};
  const login = async (email, password) => {
    try {
      const response = await fetch(`${apiUrl}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        await fetchUserInfo(data.token);  // Fetch user sau login
        navigate('/list');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error during login');
    }
  };

  const register = async (formData) => {
    try {
      const response = await fetch(`${apiUrl}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'restaurant_owner'
        }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        await fetchUserInfo(data.token);  // Fetch user sau register
        navigate('/list');
      } else {
        alert(data.message || 'Register failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error during register');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};