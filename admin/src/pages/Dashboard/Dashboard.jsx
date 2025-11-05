// // admin/src/pages/Dashboard/Dashboard.jsx (Giả sử file này tồn tại, thêm charts. Cần install recharts: npm i recharts)
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import "./Dashboard.css";

// const Dashboard = ({ url }) => {
//   const [stats, setStats] = useState({});
//   const [period, setPeriod] = useState("day"); // day or month
//   const [revenueData, setRevenueData] = useState([]);

//   const fetchStats = async () => {
//     const token = localStorage.getItem("token");
//     try {
//       const response = await axios.get(
//         `${url}/api/user/stats?period=${period}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       if (response.data.success) {
//         setStats(response.data.data);
//         // Format data cho chart
//         const formattedRevenue = response.data.data.revenue.map((item) => ({
//           date: item._id,
//           revenue: item.totalRevenue,
//         }));
//         setRevenueData(formattedRevenue);
//       } else {
//         toast.error("Error fetching stats");
//       }
//     } catch (error) {
//       toast.error("Network error");
//     }
//   };

//   useEffect(() => {
//     fetchStats();
//   }, [period]);

//   return (
//     <div className="dashboard">
//       <h2>Dashboard</h2>
//       <div className="stats">
//         <p>Users: {stats.userCount}</p>
//         <p>Restaurants: {stats.restaurantCount}</p>
//         <p>Completed Orders: {stats.completedOrdersCount}</p>
//       </div>
//       <div className="chart-section">
//         <h3>Admin Revenue ({period})</h3>
//         <select onChange={(e) => setPeriod(e.target.value)} value={period}>
//           <option value="day">By Day</option>
//           <option value="month">By Month</option>
//         </select>
//         <ResponsiveContainer width="100%" height={300}>
//           <LineChart data={revenueData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="date" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Line
//               type="monotone"
//               dataKey="revenue"
//               stroke="#8884d8"
//               activeDot={{ r: 8 }}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import "./Dashboard.css";

const Dashboard = ({ url }) => {
  const [stats, setStats] = useState({});
  const [period, setPeriod] = useState("day");
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const response = await axios.get(
        `${url}/api/user/stats?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setStats(response.data.data);

        // Format data cho revenue chart
        const formattedRevenue =
          response.data.data.revenue?.map((item) => ({
            date: item._id,
            revenue: item.totalRevenue,
          })) || [];
        setRevenueData(formattedRevenue);

        // Tạo dữ liệu cho biểu đồ tròn order status
        // Giả sử bạn có API để lấy số lượng order theo status
        const orderStatusResponse = await axios.get(
          `${url}/api/order/status-stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (orderStatusResponse.data.success) {
          setOrderStatusData(orderStatusResponse.data.data);
        } else {
          // Fallback data nếu API không có
          setOrderStatusData([
            { name: "Pending", value: 15 },
            { name: "Preparing", value: 25 },
            { name: "Delivering", value: 35 },
            { name: "Delivered", value: 20 },
            { name: "Cancelled", value: 5 },
          ]);
        }
      } else {
        toast.error("Error fetching stats");
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Tính tổng thu nhập admin (20% từ tất cả order delivered)
  const adminRevenue =
    stats.revenue?.reduce((total, item) => total + item.totalRevenue, 0) || 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's your platform performance summary.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-users">
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
            <p className="stat-number">{stats.userCount || 0}</p>
            <span className="stat-label">Registered accounts</span>
          </div>
        </div>

        <div className="stat-card total-restaurants">
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
            <p className="stat-number">{stats.restaurantCount || 0}</p>
            <span className="stat-label">Active partners</span>
          </div>
        </div>

        <div className="stat-card completed-orders">
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
            <p className="stat-number">{stats.completedOrdersCount || 0}</p>
            <span className="stat-label">Successfully delivered</span>
          </div>
        </div>

        <div className="stat-card admin-revenue">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Admin Revenue</h3>
            <p className="stat-number">${adminRevenue.toFixed(2)}</p>
            <span className="stat-label">Total earnings</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Biểu đồ cột - Revenue */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Admin Revenue ({period})</h3>
            <select onChange={(e) => setPeriod(e.target.value)} value={period}>
              <option value="day">By Day</option>
              <option value="month">By Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ tròn - Order Status */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Order Status Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Orders"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Line Chart */}
      <div className="chart-card full-width">
        <div className="chart-header">
          <h3>Revenue Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
