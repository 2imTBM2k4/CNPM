import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import { toast } from "react-toastify";

const Dashboard = ({ url }) => {
  const [stats, setStats] = useState({
    userCount: 0,
    restaurantCount: 0,
    completedOrdersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${url}/api/user/stats`, {
        headers: { token },
      });

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your platform.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.userCount}</p>
            <span className="stat-label">Registered accounts</span>
          </div>
        </div>

        <div className="stat-card restaurants">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total Restaurants</h3>
            <p className="stat-number">{stats.restaurantCount}</p>
            <span className="stat-label">Active partners</span>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Completed Orders</h3>
            <p className="stat-number">{stats.completedOrdersCount}</p>
            <span className="stat-label">Successfully delivered</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card recent-activity">
          <div className="card-header">
            <h2>Quick Stats</h2>
          </div>
          <div className="card-content">
            <div className="activity-item">
              <div className="activity-icon users-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="activity-details">
                <p className="activity-title">User Growth</p>
                <p className="activity-desc">
                  {stats.userCount} total registered users
                </p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon restaurants-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
              </div>
              <div className="activity-details">
                <p className="activity-title">Restaurant Partners</p>
                <p className="activity-desc">
                  {stats.restaurantCount} active restaurants on platform
                </p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon orders-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="activity-details">
                <p className="activity-title">Order Success Rate</p>
                <p className="activity-desc">
                  {stats.completedOrdersCount} orders delivered successfully
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card system-overview">
          <div className="card-header">
            <h2>System Overview</h2>
          </div>
          <div className="card-content">
            <div className="overview-item">
              <div className="overview-label">Platform Status</div>
              <div className="overview-value">
                <span className="status-badge active">Operational</span>
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-label">Average Orders/Restaurant</div>
              <div className="overview-value">
                {stats.restaurantCount > 0
                  ? (
                      stats.completedOrdersCount / stats.restaurantCount
                    ).toFixed(1)
                  : 0}
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-label">User-to-Restaurant Ratio</div>
              <div className="overview-value">
                {stats.restaurantCount > 0
                  ? (stats.userCount / stats.restaurantCount).toFixed(1)
                  : 0}
                <span className="ratio-label"> users per restaurant</span>
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-label">Total Transactions</div>
              <div className="overview-value highlight">
                {stats.completedOrdersCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;
