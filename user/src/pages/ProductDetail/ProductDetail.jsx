import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ProductDetail.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { food_list, cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const [tempQuantity, setTempQuantity] = useState(1); // Bắt đầu từ 1
  const [showCounter, setShowCounter] = useState(false); // Show/hide counter

  const item = food_list.find((product) => product._id === id);

  if (!item) {
    return (
      <div className="product-detail">
        <h2>Sản phẩm không tồn tại!</h2>
        <button onClick={() => navigate('/')}>Quay về trang chủ</button>
      </div>
    );
  }

  const handleAddClick = () => {
    if (!showCounter) {
      setTempQuantity(1);
      setShowCounter(true);
    } else {
      setTempQuantity(tempQuantity + 1);
    }
  };

  const handleRemoveTemp = () => {
    if (tempQuantity > 1) {
      setTempQuantity(tempQuantity - 1);
    } else {
      setTempQuantity(1); // Giữ ít nhất 1 sản phẩm
      setShowCounter(false);
    }
  };

  // SỬA: Chỉ toast nếu addToCart return true (thành công)
  const handleConfirmAdd = async () => {
    if (tempQuantity > 0) {
      const success = await addToCart(id, tempQuantity);
      if (success) {
        toast.success("Đã thêm vào giỏ hàng!");
      }  // Không toast nếu false (chưa login, lỗi, etc.)
      setShowCounter(false);
      setTempQuantity(1);
    }
  };

  // LUÔN hiển thị counter và nút thêm vào giỏ hàng, không kiểm tra cartItems
  return (
    <div className="product-detail">
      {/* Nút back quay lại trang trước thay vì '/' */}
      <button className="back-btn" onClick={() => navigate(-1)}>← Quay về</button>
      <div className="product-detail-container">
        <div className="product-detail-image">
          {/* Sử dụng trực tiếp item.image vì đây là URL đầy đủ từ Cloudinary */}
          <img src={item.image} alt={item.name} />
        </div>
        <div className="product-detail-info">
          <div className="product-detail-name-rating">
            <h2>{item.name}</h2>
            <img src={assets.rating_starts} alt="Rating" className="ratingstars" />
          </div>
          <p className="product-detail-desc">{item.description}</p>
          <p className="product-detail-price">${item.price}</p>
          <div className="product-detail-cart">
            {!showCounter ? (
              // Hiển thị nút Add ban đầu
              <img
                className="add-detail"
                onClick={handleAddClick}
                src={assets.add_icon_white}
                alt="Add to cart"
              />
            ) : (
              // Hiển thị counter và nút xác nhận
              <div className="product-detail-counter-section">
                <div className="temp-counter">
                  <img onClick={handleRemoveTemp} src={assets.remove_icon_red} alt="-" />
                  <p className="temp-quantity">{tempQuantity}</p>
                  <img onClick={handleAddClick} src={assets.add_icon_green} alt="+" />
                </div>
                <button className="confirm-btn" onClick={handleConfirmAdd}>
                  Thêm vào giỏ hàng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;