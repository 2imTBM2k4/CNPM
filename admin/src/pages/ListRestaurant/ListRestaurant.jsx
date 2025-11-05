// import React, { useEffect, useState } from "react";
// import "./ListRestaurant.css";
// import axios from "axios";
// import { toast } from "react-toastify";
// import EditRestaurant from "../Restaurant/EditRestaurant";

// const ListRestaurant = ({ url }) => {
//   const [list, setList] = useState([]);
//   const [editingRestaurant, setEditingRestaurant] = useState(null);

//   const fetchList = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       toast.error("Please login first");
//       return;
//     }
//     try {
//       const response = await axios.get(`${url}/api/restaurant/list`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (response.data.success) {
//         setList(response.data.data);
//       } else {
//         toast.error("Error fetching restaurants");
//       }
//     } catch (error) {
//       toast.error("Network error or unauthorized");
//     }
//   };

//   const removeRestaurant = async (restaurantId) => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       toast.error("Please login first");
//       return;
//     }
//     try {
//       const response = await axios.post(
//         `${url}/api/restaurant/delete`,
//         { id: restaurantId },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       await fetchList();
//       if (response.data.success) {
//         toast.success(response.data.message);
//       } else {
//         toast.error("Error");
//       }
//     } catch (error) {
//       toast.error("Network error");
//     }
//   };

//   const editRestaurant = (restaurant) => {
//     setEditingRestaurant(restaurant);
//   };

//   const closeEditModal = () => {
//     setEditingRestaurant(null);
//   };

//   useEffect(() => {
//     fetchList();
//   }, []);

//   return (
//     <div className="list add flex-col">
//       <p>All Restaurants List</p>
//       <div className="list-table">
//         <div className="list-table-format title">
//           <b>Name</b>
//           <b>Address</b>
//           <b>Phone</b>
//           <b>Description</b>
//           <b>Owner Email</b>
//           <b>Action</b>
//         </div>
//         {list.map((item, index) => {
//           return (
//             <div key={index} className="list-table-format">
//               <p>{item.name}</p>
//               <p>{item.address}</p>
//               <p>{item.phone || "N/A"}</p>
//               <p>{item.description || "N/A"}</p>
//               <p>{item.owner?.email || "N/A"}</p>
//               <div className="actions">
//                 <p
//                   onClick={() => editRestaurant(item)}
//                   className="cursor edit-btn"
//                 >
//                   ✏️
//                 </p>
//                 <p
//                   onClick={() => removeRestaurant(item._id)}
//                   className="cursor remove-btn"
//                 >
//                   X
//                 </p>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {editingRestaurant && (
//         <EditRestaurant
//           url={url}
//           restaurant={editingRestaurant}
//           onClose={closeEditModal}
//           onUpdate={fetchList}
//         />
//       )}
//     </div>
//   );
// };

// export default ListRestaurant;

// admin/src/pages/ListRestaurant/ListRestaurant.jsx
import React, { useEffect, useState } from "react";
import "./ListRestaurant.css";
import axios from "axios";
import { toast } from "react-toastify";

const ListRestaurant = ({ url }) => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }
    try {
      const response = await axios.get(`${url}/api/restaurant/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Error fetching restaurants");
      }
    } catch (error) {
      toast.error("Network error or unauthorized");
    }
  };

  const toggleLock = async (restaurantId, isLocked) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }
    try {
      const response = await axios.put(
        `${url}/api/restaurant/${restaurantId}/lock`,
        { isLocked },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchList(); // Refresh list
      } else {
        toast.error("Error");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Thêm remove nếu cần (từ version cũ)
  const removeRestaurant = async (restaurantId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }
    try {
      const response = await axios.post(
        `${url}/api/restaurant/delete`,
        { id: restaurantId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchList();
      } else {
        toast.error("Error");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <p>All Restaurants List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Name</b>
          <b>Address</b>
          <b>Phone</b>
          <b>Description</b>
          <b>Owner Email</b>
          <b>Status</b> {/* Mới */}
          <b>Action</b> {/* Mới */}
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className="list-table-format">
              <p>{item.name}</p>
              <p>{item.address}</p>
              <p>{item.phone || "N/A"}</p>
              <p>{item.description || "N/A"}</p>
              <p>{item.owner?.email || "N/A"}</p>
              <p>{item.isLocked ? "Locked" : "Active"}</p>{" "}
              {/* Mới: Hiển thị status */}
              <div className="actions">
                <button
                  onClick={() => toggleLock(item._id, !item.isLocked)}
                  className="cursor lock-btn"
                >
                  {item.isLocked ? "Unlock" : "Lock"}
                </button>
                <p
                  onClick={() => removeRestaurant(item._id)}
                  className="cursor remove-btn"
                >
                  X
                </p>{" "}
                {/* Giữ remove nếu cần */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListRestaurant;
