import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import EditProduct from "../Products/EditProduct";
import { Pencil, Trash2 } from "lucide-react";

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast.error("Please login to view your foods.");
      navigate("/login");
      return;
    }
    fetchList();
  }, [user]);

  const fetchList = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
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

  const categories = [...new Set(list.map((item) => item.category))];

  return (
    <div className="list-page">
      <div className="list-header">
        <div>
          <h1 className="list-title">Menu Items</h1>
          <p className="list-subtitle">Manage your restaurant menu</p>
        </div>
        <button className="add-item-btn" onClick={() => navigate("/add")}>
          + Add Item
        </button>
      </div>

      <div className="list-stats">
        <div className="stat-card">
          <span className="stat-value">{list.length}</span>
          <span className="stat-label">Total items</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{list.filter((i) => i.price > 0).length}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{categories.length}</span>
          <span className="stat-label">Categories</span>
        </div>
      </div>

      <div className="list-card">
        <div className="list-table">
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Actions</b>
          </div>
          {list.length === 0 ? (
            <div className="list-empty">
              <p>No menu items yet. Add your first item to get started.</p>
            </div>
          ) : (
            list.map((item, index) => (
              <div key={index} className="list-table-format">
                <img
                  src={getImgSrc(item.image)}
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = "/placeholder.jpg";
                  }}
                />
                <p className="item-name">{item.name}</p>
                <span className="category-badge">{item.category}</span>
                <p className="item-price">${Number(item.price).toFixed(2)}</p>
                <div className="actions">
                  <button
                    onClick={() => editFood(item)}
                    className="action-btn action-btn--edit"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => removeFood(item._id)}
                    className="action-btn action-btn--delete"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
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
