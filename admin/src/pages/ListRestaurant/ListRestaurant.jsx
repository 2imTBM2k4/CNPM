import React, { useEffect, useState } from 'react'
import './ListRestaurant.css'
import axios from "axios"
import {toast} from "react-toastify"
import EditRestaurant from "../Restaurant/EditRestaurant";  // Đổi tên từ EditProduct, tạo thư mục Restaurants nếu cần

const List = ({url}) => {
  const [list, setList] = useState([]);
  const [editingRestaurant, setEditingRestaurant] = useState(null); // Thêm state

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/restaurant/list`);
      if (response.data.success){
        setList(response.data.data)
      } else {
        toast.error("Error fetching restaurants")
      }
    } catch (error) {
      toast.error("Network error")
    }
  }

  const removeRestaurant = async(restaurantId) => {
    try {
      const response = await axios.post(`${url}/api/restaurant/delete`, {id: restaurantId});
      await fetchList();
      if (response.data.success){
        toast.success(response.data.message)
      } else {
        toast.error("Error")
      }
    } catch (error) {
      toast.error("Network error")
    }
  }

  // Thêm hàm edit
  const editRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant);
  }

  // Thêm hàm close modal
  const closeEditModal = () => {
    setEditingRestaurant(null);
  }

  useEffect(()=>{
    fetchList();
  },[])

  return (
    <div className='list add flex-col'>
      <p>All Restaurants List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Name</b>
          <b>Address</b>
          <b>Phone</b>
          <b>Description</b>
          <b>Owner Email</b>
          <b>Action</b>
        </div>
        {list.map((item,index)=>{
          return (
            <div key={index} className='list-table-format'>
              <p>{item.name}</p>
              <p>{item.address}</p>
              <p>{item.phone || 'N/A'}</p>
              <p>{item.description || 'N/A'}</p>
              <p>{item.owner?.email || 'N/A'}</p>
              <div className="actions">
                <p onClick={()=>editRestaurant(item)} className='cursor edit-btn'>✏️</p>
                <p onClick={()=>removeRestaurant(item._id)} className='cursor remove-btn'>X</p>
              </div>
            </div>
          )
          
        })}
      </div>

      {/* Thêm modal edit */}
      {editingRestaurant && (
        <EditRestaurant 
          url={url}
          restaurant={editingRestaurant}
          onClose={closeEditModal}
          onUpdate={fetchList}
        />
      )}
    </div>
  )
}

export default List