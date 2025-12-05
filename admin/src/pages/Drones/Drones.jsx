import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Drones.css";

const Drones = ({ url }) => {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDroneHistory, setSelectedDroneHistory] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingDrone, setEditingDrone] = useState(null);
  const [formData, setFormData] = useState({
    droneCode: "",
    cargoWeight: 0,
    status: "available",
    cargoLidStatus: "closed",
    batteryLevel: 100,
  });

  useEffect(() => {
    fetchDrones();
    
    // Auto-refresh mỗi 5 giây để cập nhật trạng thái drone
    const interval = setInterval(() => {
      fetchDrones();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDrones = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${url}/api/drone`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setDrones(response.data.data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách drone");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "cargoWeight" || name === "batteryLevel" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      if (editingDrone) {
        // Update
        const response = await axios.put(
          `${url}/api/drone/${editingDrone._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          toast.success("Cập nhật drone thành công");
          fetchDrones();
        }
      } else {
        // Create
        const response = await axios.post(
          `${url}/api/drone/create`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          toast.success("Tạo drone mới thành công");
          fetchDrones();
        }
      }
      
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
      console.error(error);
    }
  };

  const handleEdit = (drone) => {
    setEditingDrone(drone);
    setFormData({
      droneCode: drone.droneCode,
      cargoWeight: drone.cargoWeight,
      status: drone.status,
      cargoLidStatus: drone.cargoLidStatus,
      batteryLevel: drone.batteryLevel,
    });
    setShowModal(true);
  };

  const handleDelete = async (droneId) => {
    if (!window.confirm("Bạn có chắc muốn xóa drone này?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${url}/api/drone/${droneId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        toast.success("Xóa drone thành công");
        fetchDrones();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xóa drone");
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDrone(null);
    setFormData({
      droneCode: "",
      cargoWeight: 0,
      status: "available",
      cargoLidStatus: "closed",
      batteryLevel: 100,
    });
  };

  const handleViewHistory = async (drone) => {
    setSelectedDroneHistory(drone);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${url}/api/drone/history/${drone._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setHistoryData(response.data.data.history);
      }
    } catch (error) {
      toast.error("Lỗi khi tải lịch sử giao hàng");
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedDroneHistory(null);
    setHistoryData([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getHistoryStatusBadge = (status) => {
    const statusMap = {
      delivering: { text: "Đang giao", class: "history-delivering" },
      delivered: { text: "Thành công", class: "history-delivered" },
      cancelled: { text: "Đã hủy", class: "history-cancelled" },
    };
    const statusInfo = statusMap[status] || { text: status, class: "" };
    return <span className={`history-status ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      available: { text: "Sẵn sàng", class: "status-available" },
      delivering: { text: "Đang giao", class: "status-delivering" },
      delivered: { text: "Đã giao", class: "status-delivered" },
    };
    const statusInfo = statusMap[status] || { text: status, class: "" };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getLidStatusBadge = (lidStatus) => {
    return (
      <span className={`lid-badge ${lidStatus === "open" ? "lid-open" : "lid-closed"}`}>
        {lidStatus === "open" ? "Đang mở" : "Đang đóng"}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="drones-container">
      <div className="drones-header">
        <div className="header-left">
          <h1>Quản lý Drone</h1>
          <span className="auto-refresh-indicator">🔄 Tự động cập nhật mỗi 5s</span>
        </div>
        <button className="btn-add" onClick={() => setShowModal(true)}>
          + Thêm Drone
        </button>
      </div>

      <div className="drones-grid">
        {drones.map((drone) => (
          <div key={drone._id} className="drone-card">
            <div className="drone-card-header">
              <h3>{drone.droneCode}</h3>
              {getStatusBadge(drone.status)}
            </div>
            
            <div className="drone-info">
              <div className="info-row">
                <span className="label">Trọng lượng khoang:</span>
                <span className={`value weight-value ${drone.cargoWeight > 0 ? 'loaded' : 'empty'}`}>
                  {drone.cargoWeight}g
                </span>
              </div>
              <div className="info-row">
                <span className="label">Nắp khoang:</span>
                {getLidStatusBadge(drone.cargoLidStatus)}
              </div>
              <div className="info-row">
                <span className="label">Pin:</span>
                <span className="value">{drone.batteryLevel}%</span>
              </div>
              <div className="info-row">
                <span className="label">Tổng giao hàng:</span>
                <span className="value">{drone.totalDeliveries}</span>
              </div>
              {drone.currentOrder && (
                <div className="info-row">
                  <span className="label">Đơn hiện tại:</span>
                  <span className="value order-id">{drone.currentOrder._id || drone.currentOrder}</span>
                </div>
              )}
            </div>

            <div className="drone-actions">
              <button className="btn-history" onClick={() => handleViewHistory(drone)}>
                📋 Lịch sử
              </button>
              <button className="btn-edit" onClick={() => handleEdit(drone)}>
                Sửa
              </button>
              <button 
                className="btn-delete" 
                onClick={() => handleDelete(drone._id)}
                disabled={drone.status === "delivering" || drone.totalDeliveries > 0}
                title={drone.totalDeliveries > 0 ? "Không thể xóa drone đã giao hàng" : ""}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {drones.length === 0 && (
        <div className="empty-state">
          <p>Chưa có drone nào. Hãy thêm drone mới!</p>
        </div>
      )}

      {showHistoryModal && selectedDroneHistory && (
        <div className="modal-overlay" onClick={handleCloseHistoryModal}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Lịch sử giao hàng - {selectedDroneHistory.droneCode}</h2>
              <button className="btn-close" onClick={handleCloseHistoryModal}>×</button>
            </div>
            
            <div className="history-content">
              <div className="history-summary">
                <span>Tổng số đơn đã giao: <strong>{selectedDroneHistory.totalDeliveries}</strong></span>
              </div>
              
              {historyLoading ? (
                <div className="history-loading">Đang tải...</div>
              ) : historyData.length === 0 ? (
                <div className="history-empty">Chưa có lịch sử giao hàng</div>
              ) : (
                <div className="history-list">
                  {historyData.map((item, index) => (
                    <div key={item._id || index} className="history-item">
                      <div className="history-item-header">
                        <span className="history-order-id">#{item.orderId?._id?.slice(-8) || "N/A"}</span>
                        {getHistoryStatusBadge(item.status)}
                      </div>
                      <div className="history-item-body">
                        <p><strong>Nhà hàng:</strong> {item.restaurantId?.name || "N/A"}</p>
                        <p><strong>Khách hàng:</strong> {item.customerName}</p>
                        <p><strong>Địa chỉ:</strong> {item.customerAddress}</p>
                        <p><strong>Giá trị:</strong> {item.totalPrice?.toLocaleString()}đ</p>
                        <p><strong>Bắt đầu:</strong> {formatDate(item.startTime)}</p>
                        {item.endTime && <p><strong>Kết thúc:</strong> {formatDate(item.endTime)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDrone ? "Chỉnh sửa Drone" : "Thêm Drone mới"}</h2>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Mã Drone *</label>
                <input
                  type="text"
                  name="droneCode"
                  value={formData.droneCode}
                  onChange={handleInputChange}
                  required
                  placeholder="VD: DRONE-001"
                />
              </div>

              <div className="form-group">
                <label>Trọng lượng khoang hàng (gram)</label>
                <input
                  type="number"
                  name="cargoWeight"
                  value={formData.cargoWeight}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Trạng thái Drone</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="available">Sẵn sàng</option>
                  <option value="delivering">Đang giao</option>
                  <option value="delivered">Đã giao</option>
                </select>
              </div>

              <div className="form-group">
                <label>Trạng thái nắp khoang</label>
                <select
                  name="cargoLidStatus"
                  value={formData.cargoLidStatus}
                  onChange={handleInputChange}
                >
                  <option value="closed">Đang đóng</option>
                  <option value="open">Đang mở</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mức pin (%)</label>
                <input
                  type="number"
                  name="batteryLevel"
                  value={formData.batteryLevel}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {editingDrone ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drones;
