import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // MỚI: Track loading khi init auth
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo(token);
    } else {
      // Không có token: done loading ngay
      setIsLoading(false);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      setIsLoading(true); // MỚI: Bắt đầu loading
      const response = await fetch(`${apiUrl}/api/user/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
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
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response not JSON - Likely server error page');
      }
      const data = await response.json();
      if (data.success) {
        let fetchedUser = data.user;
        if (fetchedUser.restaurantId && typeof fetchedUser.restaurantId === 'object') {
          fetchedUser.restaurantId = fetchedUser.restaurantId._id || fetchedUser.restaurantId.toString();
        }
        setUser(fetchedUser);
        // FIX: Set localStorage cho socket join
        if (fetchedUser.restaurantId) {
          localStorage.setItem('restaurantId', fetchedUser.restaurantId);
          console.log('Set restaurantId in localStorage:', fetchedUser.restaurantId);  // DEBUG
        }
      } else {
        throw new Error(data.message || 'Failed to fetch user info');
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      alert(error.message);
      logout();
    } finally {
      setIsLoading(false); // MỚI: Kết thúc loading (luôn chạy)
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true); // MỚI: Loading khi login
      const response = await fetch(`${apiUrl}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        await fetchUserInfo(data.token);  // Sẽ set restaurantId ở đây
        navigate('/list');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error during login');
    } finally {
      setIsLoading(false); // MỚI: Kết thúc loading
    }
  };

  const register = async (formData) => {
    try {
      setIsLoading(true); // MỚI: Loading khi register
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
        await fetchUserInfo(data.token);  // Sẽ set restaurantId ở đây
        navigate('/list');
      } else {
        alert(data.message || 'Register failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error during register');
    } finally {
      setIsLoading(false); // MỚI: Kết thúc loading
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('restaurantId');  // FIX: Clear khi logout
    setUser(null);
    setIsLoading(false); // MỚI: Không loading khi logout
    navigate('/login');
  };

  // MỚI: Value context bao gồm isLoading
  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};