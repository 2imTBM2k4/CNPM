import React, { useEffect, useState, useContext } from "react"; // SỬA: Import AuthContext
import { AuthContext } from "../../context/AuthContext"; // SỬA: Import để check user
import { useNavigate } from "react-router-dom"; // SỬA: Import navigate
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import EditProduct from "../Products/EditProduct";

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const { user } = useContext(AuthContext); // SỬA: Get user từ context
  const navigate = useNavigate(); // SỬA: Để redirect nếu không auth

  useEffect(() => {
    // SỬA: Check user trước fetch, nếu null redirect login
    if (!user) {
      toast.error("Please login to view your foods.");
      navigate("/login");
      return;
    }
    fetchList();
  }, [user]); // SỬA: Depend on user

  const fetchList = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      // SỬA: Double check
      toast.error("No authentication. Please login again.");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(`${url}/api/food/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error(
          "Error fetching list: " + (response.data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Fetch list error:", error);
      if (error.response?.status === 403) {
        toast.error("Access denied. Your account may be pending approval.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("Error fetching food list");
      }
    }
  };

  const removeFood = async (foodId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Please login again.");
      return;
    }

    try {
      const response = await axios.post(
        `${url}/api/food/remove`,
        { id: foodId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error("Error removing food");
      }
    } catch (error) {
      console.error("Remove food error:", error);
      toast.error("Error removing food");
    }
  };

  const editFood = (product) => {
    setEditingProduct(product);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
  };

  useEffect(() => {
    fetchList();
  }, []);

  const getImgSrc = (img) => {
    if (!img) return "/placeholder.jpg";
    return img.startsWith("http") ? img : `${url}/images/${img}`;
  };

  return (
    <div className="list add flex-col">
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className="list-table-format">
              <img
                src={getImgSrc(item.image)}
                alt={item.name}
                onError={(e) => {
                  e.target.src = "/placeholder.jpg";
                }}
              />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>${item.price}</p>
              <div className="actions">
                <p onClick={() => editFood(item)} className="cursor edit-btn">
                  ✏️
                </p>
                <p
                  onClick={() => removeFood(item._id)}
                  className="cursor remove-btn"
                >
                  X
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {editingProduct && (
        <EditProduct
          url={url}
          product={editingProduct}
          onClose={closeEditModal}
          onUpdate={fetchList}
        />
      )}
    </div>
  );
};

export default List;
