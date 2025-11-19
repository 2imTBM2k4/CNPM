import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./DroneDelivery.css";

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// --- CẤU HÌNH TỌA ĐỘ ---
const HCMC_CENTER = [10.7769, 106.7008]; // (Tọa độ Dinh Độc Lập / Diamond Plaza)

// Bounding box cho TP.HCM để tạo điểm ngẫu nhiên
const HCMC_BOUNDS = {
  minLat: 10.7,
  maxLat: 10.85,
  minLng: 106.6,
  maxLng: 106.8,
};

// Hàm tạo tọa độ ngẫu nhiên trong bounding box
const getRandomCoordinate = () => {
  const lat =
    HCMC_BOUNDS.minLat +
    Math.random() * (HCMC_BOUNDS.maxLat - HCMC_BOUNDS.minLat);
  const lng =
    HCMC_BOUNDS.minLng +
    Math.random() * (HCMC_BOUNDS.maxLng - HCMC_BOUNDS.minLng);
  return [lat, lng];
};

// Create straight line path with multiple points
const createStraightPath = (start, end, numPoints = 100) => {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const path = [];
  for (let t = 0; t <= 1; t += 1 / numPoints) {
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;
    path.push([lat, lng]);
  }
  return path;
};

// Icon cho Drone (Bạn có thể đổi iconUrl)
const droneIcon = L.icon({
  iconUrl: "./../src/assets/drone.png", // Icon mặc định
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component DroneAnimation (Giữ nguyên, đã sửa lỗi lặp)
const DroneAnimation = ({ path, onComplete }) => {
  const map = useMap();
  const [dronePosition, setDronePosition] = useState(null);
  const [flightCompleted, setFlightCompleted] = useState(false);
  const droneRef = useRef(null);
  const animationFrameId = useRef(null);
  const startTimeRef = useRef(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const duration = 10000; // 10s total

  useEffect(() => {
    if (!path || path.length < 2 || flightCompleted) {
      return;
    }

    const startPoint = path[0];
    const endPoint = path[path.length - 1];
    setDronePosition(startPoint);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    startTimeRef.current = null;

    const animate = (currentTime) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const elapsedTime = currentTime - startTimeRef.current;
      const progress = Math.min(elapsedTime / duration, 1);

      if (progress < 1) {
        const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * progress;
        const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * progress;
        const currentPosition = [lat, lng];

        setDronePosition(currentPosition);
        if (droneRef.current) {
          droneRef.current.setLatLng(currentPosition);
        }

        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        setDronePosition(endPoint);
        if (droneRef.current) {
          droneRef.current.setLatLng(endPoint);
        }
        if (!flightCompleted && onCompleteRef.current) {
          onCompleteRef.current();
        }
        setFlightCompleted(true);
        startTimeRef.current = null;
        animationFrameId.current = null;
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [path, map, flightCompleted]);

  return dronePosition ? (
    <Marker position={dronePosition} icon={droneIcon} ref={droneRef} />
  ) : null;
};

// Component MapBounds (Sửa lỗi)
const MapBounds = ({ start, end }) => {
  const map = useMap();
  const hasFitted = useRef(false); // Dùng ref để chỉ fit một lần

  useEffect(() => {
    // Chỉ chạy khi có đủ tọa độ và chưa fit lần nào
    if (start && end && !hasFitted.current) {
      const isValidCoord = (coord) =>
        coord && Array.isArray(coord) && isFinite(coord[0]) && isFinite(coord[1]);

      if (isValidCoord(start) && isValidCoord(end)) {
        try {
          const bounds = L.latLngBounds([start, end]);
          // Kiểm tra xem bounds có hợp lệ không (hai điểm không trùng nhau)
          if (bounds.isValid() && !bounds.getSouthWest().equals(bounds.getNorthEast())) {
            map.fitBounds(bounds, { padding: [50, 50] });
          } else {
            // Nếu bounds không hợp lệ (ví dụ: 2 điểm giống nhau), chỉ cần set view
            map.setView(start, 15);
          }
          hasFitted.current = true; // Đánh dấu đã fit
        } catch (e) {
          console.error("Error fitting bounds:", e, start, end);
          // Fallback: nếu có lỗi, set view về điểm bắt đầu
          map.setView(start, 15);
        }
      }
    }
  }, [start, end, map]); // Phụ thuộc vào start, end, và map

  return null; // Component này không render gì cả
};

// --- COMPONENT CHÍNH (SỬ DỤNG ĐỊA CHỈ THỰC TỪ DATABASE) ---
const DroneDelivery = ({ order, onDeliveryComplete }) => {
  const [start, setStart] = useState(null); // [lat, lng] for restaurant
  const [end, setEnd] = useState(null); // [lat, lng] for customer
  const [path, setPath] = useState([]);
  const [startAddress, setStartAddress] = useState("Đang tải...");
  const [endAddress, setEndAddress] = useState("Đang tải...");
  const [droneArrived, setDroneArrived] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [canConfirm, setCanConfirm] = useState(false);

  // Hàm chuyển địa chỉ thành tọa độ (Geocoding)
  const getCoordsFromAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'DroneDeliveryApp/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      // Fallback: Nếu không tìm thấy, trả về tọa độ ngẫu nhiên trong HCMC
      return getRandomCoordinate();
    } catch (error) {
      console.error("Error geocoding address:", error);
      return getRandomCoordinate();
    }
  };

  // Khởi tạo tọa độ và đường bay từ địa chỉ thực
  useEffect(() => {
    if (!order || !order._id) return;

    const initializeDelivery = async () => {
      const storageKey = `drone_location_${order._id}`;
      let startPos, endPos;
      let restaurantAddr, customerAddr;

      // 1. Lấy địa chỉ từ order
      // Địa chỉ nhà hàng
      restaurantAddr = order.restaurantId?.address || "TP. Hồ Chí Minh, Việt Nam";
      
      // Địa chỉ khách hàng
      const shipping = order.shippingAddress;
      customerAddr = shipping 
        ? `${shipping.address}, ${shipping.city}, ${shipping.state}, ${shipping.country}`
        : "TP. Hồ Chí Minh, Việt Nam";

      // 2. Set địa chỉ hiển thị ngay
      setStartAddress(restaurantAddr);
      setEndAddress(customerAddr);

      // 3. Kiểm tra xem tọa độ đã được lưu trong localStorage chưa
      const storedLocations = localStorage.getItem(storageKey);

      if (storedLocations) {
        // Nếu có, sử dụng tọa độ đã lưu
        const { start, end } = JSON.parse(storedLocations);
        startPos = start;
        endPos = end;
      } else {
        // Nếu không, chuyển địa chỉ thành tọa độ
        startPos = await getCoordsFromAddress(restaurantAddr);
        endPos = await getCoordsFromAddress(customerAddr);
        
        // Lưu lại để lần sau không phải gọi API
        localStorage.setItem(
          storageKey,
          JSON.stringify({ start: startPos, end: endPos })
        );
      }

      // 4. Tạo đường bay và cập nhật state
      const straightPath = createStraightPath(startPos, endPos);
      setStart(startPos);
      setEnd(endPos);
      setPath(straightPath);
    };

    initializeDelivery();
  }, [order]); // Chạy lại khi `order` thay đổi

  const handleComplete = () => {
    setDroneArrived(true);
  };

  const handleScanQR = async () => {
    try {
      const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${url}/api/drone/scan-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          qrCode: order.qrCode,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setQrScanned(true);
        setLidOpen(true);
        
        // Sau 5 giây, đóng nắp và cho phép xác nhận
        setTimeout(() => {
          setLidOpen(false);
          setCanConfirm(true);
          if (onDeliveryComplete) {
            onDeliveryComplete();
          }
        }, 5000);
      } else {
        alert(data.message || "Lỗi khi quét QR code");
      }
    } catch (error) {
      console.error("Error scanning QR:", error);
      alert("Lỗi khi quét QR code");
    }
  };

  // Vẫn giữ loading state cho đẹp,
  // vì 'start' lúc đầu là null
  if (!start) {
    return (
      <div className="drone-delivery-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải lộ trình giao hàng...</p>
      </div>
    );
  }

  return (
    <div className="drone-delivery-container">
      <div className="drone-delivery-header">
        <h3>🚁 Theo dõi Drone giao hàng</h3>
        <div className="delivery-info">
          <p>
            <strong>🏪 Từ:</strong> {startAddress}
          </p>
          <p>
            <strong>🏠 Đến:</strong> {endAddress}
          </p>
          <p>
            <strong>⏱️ Thời gian tới ước tính:</strong> 10 giây
          </p>
        </div>
      </div>
      
      <div className="drone-delivery-map-container">
        <MapContainer
          center={HCMC_CENTER}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          {start && end && <MapBounds start={start} end={end} />}

          {path.length > 0 && (
            <Polyline positions={path} color="#FF6B6B" weight={5} />
          )}
          {start && (
            <Marker
              position={start}
              icon={L.divIcon({
                html: "🏪",
                className: "",
                iconSize: [30, 30],
              })}
            >
              <Popup>
                <strong>Nhà hàng:</strong><br/>
                {startAddress}
              </Popup>
            </Marker>
          )}
          {end && (
            <Marker
              position={end}
              icon={L.divIcon({
                html: "🏠",
                className: "",
                iconSize: [30, 30],
              })}
            >
              <Popup>
                <strong>Khách hàng:</strong><br/>
                {endAddress}
              </Popup>
            </Marker>
          )}

          {path.length > 0 && (
            <DroneAnimation path={path} onComplete={handleComplete} />
          )}
        </MapContainer>
      </div>

      {/* QR Code Section */}
      {droneArrived && order.qrCode && (
        <div className="qr-section">
          <div className="qr-header">
            <h4>📱 Mã QR để nhận hàng</h4>
            {qrScanned && (
              <span className="qr-status success">✓ Đã quét</span>
            )}
          </div>
          
          <div className="qr-code-display">
            <div className="qr-code-box">
              <div className="qr-placeholder">
                {order.qrCode}
              </div>
            </div>
            
            {!qrScanned && (
              <button 
                className="scan-qr-btn"
                onClick={handleScanQR}
              >
                📷 Xác nhận quét QR
              </button>
            )}
          </div>

          {qrScanned && (
            <div className="delivery-status">
              <div className={`status-item ${lidOpen ? 'active' : 'completed'}`}>
                <span className="status-icon">{lidOpen ? '🔓' : '🔒'}</span>
                <span className="status-text">
                  Nắp khoang: {lidOpen ? 'Đang mở' : 'Đã đóng'}
                </span>
              </div>
              
              {lidOpen && (
                <div className="countdown-message">
                  ⏱️ Nắp sẽ tự động đóng sau 5 giây. Vui lòng lấy đồ ăn!
                </div>
              )}
              
              {canConfirm && (
                <div className="confirm-message">
                  ✅ Bạn có thể xác nhận đã nhận hàng bên dưới
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DroneDelivery;
