import React, { useState } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Add = ({ url }) => {
  // Prop url từ App

  const [image, setImage] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "", // Đổi default từ "Salad" sang "" để khuyến khích nhập thủ công
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value })); // Giữ nguyên, sẽ áp dụng cho input text
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    // Thêm validation đơn giản cho category (tùy chọn, để tránh string rỗng)
    if (!data.category.trim()) {
      toast.error("Category không được để trống!");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category.trim()); // Trim space để sạch sẽ
    formData.append("image", image);

    const response = await axios.post(`${url}/api/food/add`, formData, {
      // Sử dụng prop url
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success) {
      setData({
        name: "",
        description: "",
        price: "",
        category: "", // Reset về ""
      });
      setImage(false);
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
  };

  return (
    <div className="add">
      <form className="flex-col" onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img
              className="image"
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="image"
            hidden
            required
          />
        </div>
        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            name="name"
            placeholder="Type here"
          />
        </div>
        <div className="add-product-description flex-col">
          <p>Product Description</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows="6"
            placeholder="Write content here"
            required
          ></textarea>
        </div>
        <div className="add-category-price">
          <div className="add-category flex-col">
            {" "}
            {/* Giữ class để CSS không thay đổi */}
            <p>Product Category</p>
            <input // Thay select bằng input text
              className="selectt" // Giữ class CSS cũ để style giống dropdown (nếu cần chỉnh CSS thì thêm border-radius, etc.)
              onChange={onChangeHandler}
              value={data.category}
              type="text"
              name="category"
              placeholder="Nhập category (ví dụ: Salad, Rolls...)"
              required // Bắt buộc nhập
            />
          </div>
          <div className="add-price flex-col">
            <p>Product Price</p>
            <input
              className="inputclasa"
              onChange={onChangeHandler}
              value={data.price}
              type="Number"
              name="price"
              placeholder="$20"
            />
          </div>
        </div>
        <button type="submit" className="add-btn">
          ADD
        </button>
      </form>
    </div>
  );
};

export default Add;
