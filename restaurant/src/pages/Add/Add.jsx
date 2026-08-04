import React, { useEffect, useRef, useState } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import OptionGroupBuilder, {
  validateOptionGroups,
  normaliseOptionGroups,
} from "../../../../shared/components/OptionGroupBuilder";

const Add = ({ url }) => {
  // Prop url từ App

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [optionGroups, setOptionGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "", // Đổi default từ "Salad" sang "" để khuyến khích nhập thủ công
  });

  // createObjectURL in the render body would mint a new blob URL on every
  // render and never free any of them. Make one per file and revoke it.
  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value })); // Giữ nguyên, sẽ áp dụng cho input text
  };

  const resetForm = () => {
    setData({ name: "", description: "", price: "", category: "" });
    setImage(null);
    setOptionGroups([]);
    // Clearing state alone leaves the input's value set, so re-picking the
    // same file would fire no change event.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (submitting) return;

    // Validated here rather than with `required` on the input: that input is
    // hidden, and Chrome refuses to submit a form whose invalid control can't
    // be focused — the click would silently do nothing.
    if (!image) {
      toast.error("Please choose a product image");
      return;
    }

    // Thêm validation đơn giản cho category (tùy chọn, để tránh string rỗng)
    if (!data.category.trim()) {
      toast.error("Category không được để trống!");
      return;
    }

    const problems = validateOptionGroups(optionGroups);
    if (problems.length > 0) {
      toast.error(problems[0]);
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category.trim()); // Trim space để sạch sẽ
    formData.append("image", image);
    // multipart can't carry structured data, so the server parses this string.
    formData.append(
      "optionGroups",
      JSON.stringify(normaliseOptionGroups(optionGroups))
    );

    try {
      setSubmitting(true);
      const response = await axios.post(`${url}/api/food/add`, formData, {
        // Sử dụng prop url
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        resetForm();
        toast.success(response.data.message);
      } else {
        // Keep what they typed so they can fix it and resubmit.
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setSubmitting(false);
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
              src={preview || assets.upload_area}
              alt={preview ? "Selected product image" : "Upload a product image"}
            />
          </label>
          <input
            ref={fileInputRef}
            onChange={(e) => setImage(e.target.files[0] || null)}
            type="file"
            accept="image/*"
            id="image"
            hidden
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
        <OptionGroupBuilder value={optionGroups} onChange={setOptionGroups} />
        <button type="submit" className="add-btn" disabled={submitting}>
          {submitting ? "ADDING…" : "ADD"}
        </button>
      </form>
    </div>
  );
};

export default Add;
