// import React, { useEffect, useState } from "react";
// import "./ListUsers.css";
// import axios from "axios";
// import { toast } from "react-toastify";
// import EditUser from "../Users/EditUser";

// const ListUsers = ({ url }) => {
//   const [list, setList] = useState([]);
//   const [editingUser, setEditingUser] = useState(null);

//   const fetchList = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       toast.error("Please login first");
//       return;
//     }
//     try {
//       const response = await axios.get(`${url}/api/user/list`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (response.data.success) {
//         setList(response.data.data);
//       } else {
//         toast.error("Error fetching users");
//       }
//     } catch (error) {
//       toast.error("Network error or unauthorized");
//     }
//   };

//   const removeUser = async (userId) => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       toast.error("Please login first");
//       return;
//     }
//     try {
//       const response = await axios.post(
//         `${url}/api/user/delete`,
//         { id: userId },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       if (response.data.success) {
//         toast.success(response.data.message);
//         fetchList();
//       } else {
//         toast.error("Error");
//       }
//     } catch (error) {
//       toast.error("Network error");
//     }
//   };

//   const lockUser = async (userId, locked) => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       toast.error("Please login first");
//       return;
//     }
//     try {
//       const response = await axios.post(
//         `${url}/api/user/lock`,
//         { id: userId, locked },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       if (response.data.success) {
//         toast.success(response.data.message);
//         fetchList();
//       } else {
//         toast.error("Error");
//       }
//     } catch (error) {
//       toast.error("Network error");
//     }
//   };

//   const editUser = (user) => {
//     setEditingUser(user);
//   };

//   const closeEditModal = () => {
//     setEditingUser(null);
//   };

//   useEffect(() => {
//     fetchList();
//   }, []);

//   return (
//     <div className="list add flex-col">
//       <p>All Users List</p>
//       <div className="list-table">
//         <div className="list-table-format title">
//           <b>Name</b>
//           <b>Email</b>
//           <b>Role</b>
//           <b>Phone</b>
//           <b>Locked</b>
//           <b>Action</b>
//         </div>
//         {list.map((item, index) => (
//           <div key={index} className="list-table-format">
//             <p>{item.name}</p>
//             <p>{item.email}</p>
//             <p>{item.role}</p>
//             <p>{item.phone || "N/A"}</p>
//             <p>{item.locked ? "Yes" : "No"}</p>
//             <div className="actions">
//               <p onClick={() => editUser(item)} className="cursor edit-btn">
//                 ✏️
//               </p>
//               <p
//                 onClick={() => lockUser(item._id, !item.locked)}
//                 className="cursor lock-btn"
//               >
//                 {item.locked ? "Unlock" : "Lock"}
//               </p>
//               <p
//                 onClick={() => removeUser(item._id)}
//                 className="cursor remove-btn"
//               >
//                 X
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {editingUser && (
//         <EditUser
//           url={url}
//           user={editingUser}
//           onClose={closeEditModal}
//           onUpdate={fetchList}
//         />
//       )}
//     </div>
//   );
// };

// export default ListUsers;

// admin/src/pages/ListUsers/ListUsers.jsx
import React, { useEffect, useState } from "react";
import "./ListUsers.css";
import axios from "axios";
import { toast } from "react-toastify";

const ListUsers = ({ url }) => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${url}/api/user/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Error fetching users");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const lockUser = async (id, locked) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${url}/api/user/lock`,
        { id, locked },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        toast.success(locked ? "Locked" : "Unlocked");
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
      <p>All Users List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Name</b>
          <b>Email</b>
          <b>Role</b>
          <b>Phone</b>
          <b>Locked</b>
          <b>Actions</b>
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className="list-table-format">
              <p>{item.name}</p>
              <p>{item.email}</p>
              <p>{item.role}</p>
              <p>{item.phone || "N/A"}</p>
              <p>{item.locked ? "Yes" : "No"}</p>
              <div className="actions">
                <p
                  onClick={() => lockUser(item._id, !item.locked)}
                  className="cursor lock-btn"
                >
                  {item.locked ? "Unlock" : "Lock"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListUsers;
