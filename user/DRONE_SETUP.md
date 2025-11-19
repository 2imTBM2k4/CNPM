# Hướng dẫn cấu hình Drone Delivery Service

## Yêu cầu

Để sử dụng tính năng Drone Delivery, bạn cần cấu hình Google Maps API key.

## Các bước cấu hình

1. **Lấy Google Maps API Key:**

   - Truy cập [Google Cloud Console](https://console.cloud.google.com/)
   - Tạo project mới hoặc chọn project hiện có
   - Bật các API sau:
     - Maps JavaScript API
     - Geocoding API
     - Directions API
   - Tạo API key trong phần "Credentials"
   - (Tùy chọn) Giới hạn API key cho domain của bạn để bảo mật

2. **Thêm API key vào file .env:**

   - Tạo file `.env` trong thư mục `user/` (nếu chưa có)
   - Thêm dòng sau:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. **Khởi động lại ứng dụng:**
   - Restart dev server để áp dụng thay đổi

## Sử dụng

1. Khi nhà hàng chuyển trạng thái đơn hàng sang "Delivering", drone sẽ sẵn sàng giao hàng
2. Trong trang "Đơn hàng của tôi", click vào nút "🚁 Xem chi tiết giao hàng" cho đơn hàng đang giao
3. Bản đồ sẽ hiển thị:
   - Vị trí nhà hàng (màu đỏ)
   - Vị trí khách hàng (màu xanh)
   - Tuyến đường từ nhà hàng đến khách hàng
   - Drone bay dọc theo tuyến đường trong 15 giây
4. Sau khi drone bay xong, nút "✅ Xác nhận đã nhận hàng" sẽ sáng lên và bạn có thể xác nhận nhận hàng

## Lưu ý

- Đảm bảo địa chỉ nhà hàng và địa chỉ khách hàng đầy đủ và chính xác để Google Maps có thể geocode
- Nếu không có API key, hệ thống sẽ hiển thị thông báo lỗi
