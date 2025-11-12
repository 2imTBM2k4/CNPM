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

// --- COMPONENT CHÍNH (ĐÃ SỬA LỖI RACE CONDITION) ---
const DroneDelivery = ({ order, onDeliveryComplete }) => {
  const [start, setStart] = useState(null); // [lat, lng] for restaurant
  const [end, setEnd] = useState(null); // [lat, lng] for customer
  const [path, setPath] = useState([]);

  // Khởi tạo tọa độ và đường bay
  useEffect(() => {
    if (!order || !order._id) return;

    const storageKey = `drone_location_${order._id}`;
    let startPos, endPos;

    // 1. Kiểm tra xem tọa độ đã được lưu trong localStorage cho đơn hàng này chưa
    const storedLocations = localStorage.getItem(storageKey);

    if (storedLocations) {
      // Nếu có, sử dụng tọa độ đã lưu
      const { start, end } = JSON.parse(storedLocations);
      startPos = start;
      endPos = end;
    } else {
      // Nếu không, tạo tọa độ ngẫu nhiên mới và lưu lại
      startPos = getRandomCoordinate();
      endPos = getRandomCoordinate();
      localStorage.setItem(
        storageKey,
        JSON.stringify({ start: startPos, end: endPos })
      );
    }

    // 2. Tạo đường bay và cập nhật state
    const straightPath = createStraightPath(startPos, endPos);
    setStart(startPos);
    setEnd(endPos);
    setPath(straightPath);
  }, [order]); // Chạy lại khi `order` thay đổi

  const handleComplete = () => {
    onDeliveryComplete?.();
  };

  // Vẫn giữ loading state cho đẹp,
  // vì 'start' lúc đầu là null
  if (!start) {
    return (
      <div className="drone-delivery-loading">
        <div className="loading-spinner"></div>
        <p>Đang tạo lộ trình ngẫu nhiên...</p>
      </div>
    );
  }

  return (
    <div className="drone-delivery-container">
      <div className="drone-delivery-header">
        <h3>🚁 Theo dõi Drone giao hàng</h3>
        <div className="delivery-info">
          <p>
            <strong>Từ:</strong> Nhà hàng (Vị trí ngẫu nhiên)
          </p>
          <p>
            <strong>Đến:</strong> Khách hàng (Vị trí ngẫu nhiên)
          </p>
          <p>
            <strong>Thời gian bay:</strong> 10 giây (Demo)
          </p>
        </div>
      </div>
      <div className="drone-delivery-map-container">
        <MapContainer
          center={HCMC_CENTER} // ⚠️ SỬA LỖI: Dùng TÂM CỐ ĐỊNH
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {/* Các component này giờ sẽ an toàn:
            1. Map tải ở HCMC_CENTER.
            2. useEffect chạy, 'start' và 'end' được set.
            3. MapBounds chạy, di chuyển camera tới 'start' và 'end'.
            4. Polyline và DroneAnimation vẽ đúng lộ trình.
          */}
          {start && end && <MapBounds start={start} end={end} />}

          {path.length > 0 && (
            <Polyline positions={path} color="#FF6B6B" weight={5} />
          )}
          {start && (
            <Marker
              position={start}
              icon={L.divIcon({
                html: "🏪", // Icon nhà hàng
                className: "",
                iconSize: [30, 30],
              })}
            >
              <Popup>Nhà hàng (Ngẫu nhiên)</Popup>
            </Marker>
          )}
          {end && (
            <Marker
              position={end}
              icon={L.divIcon({
                html: "🏠", // Icon khách hàng
                className: "",
                iconSize: [30, 30],
              })}
            >
              <Popup>Khách hàng (Ngẫu nhiên)</Popup>
            </Marker>
          )}

          {path.length > 0 && (
            <DroneAnimation path={path} onComplete={handleComplete} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default DroneDelivery;
