import React from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Add from './pages/Add/Add';
import List from './pages/List/List';  // Giả sử có List.jsx
import Orders from './pages/Orders/Orders';
import EditRestaurant from './pages/EditRestaurant/EditRestaurant';  // Mới: Import
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DashboardLayout = () => (
  <>
    <Navbar />
    <hr />
    <div className="app-content">
      <Sidebar />
      <Outlet />
    </div>
  </>
);

const App = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/list" replace />} />
          <Route path="/add" element={<Add url={url} />} />
          <Route path="/list" element={<List url={url} />} />
          <Route path="/orders" element={<Orders url={url} />} />
          <Route path="/edit-restaurant" element={<EditRestaurant url={url} />} />  {/* Mới */}
        </Route>
      </Routes>
    </div>
  );
};

export default App;