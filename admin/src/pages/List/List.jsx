// Cập nhật List.jsx
import React, { useEffect, useState } from 'react'
import './List.css'
import axios from "axios"
import {toast} from "react-toastify"
import EditProduct from '../Products/EditProduct' // Thêm import

const List = ({url}) => {
  const [list, setList] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null); // Thêm state

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success){
      setList(response.data.data)
    } else {
      toast.error("Error")
    }
  }

  const removeFood = async(foodId) => {
    const response = await axios.post(`${url}/api/food/remove`,{id:foodId});
    await fetchList();
    if (response.data.success){
      toast.success(response.data.message)
    } else {
      toast.error("Error")
    }
  }

  // Thêm hàm edit
  const editFood = (product) => {
    setEditingProduct(product);
  }

  // Thêm hàm close modal
  const closeEditModal = () => {
    setEditingProduct(null);
  }

  useEffect(()=>{
    fetchList();
  },[])

  return (
    <div className='list add flex-col'>
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.map((item,index)=>{
          return (
            <div key={index} className='list-table-format'>
              <img src={`${url}/images/`+item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>${item.price}</p>
              <div className="actions">
                <p onClick={()=>editFood(item)} className='cursor edit-btn'>✏️</p>
                <p onClick={()=>removeFood(item._id)} className='cursor remove-btn'>X</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Thêm modal edit */}
      {editingProduct && (
        <EditProduct 
          url={url}
          product={editingProduct}
          onClose={closeEditModal}
          onUpdate={fetchList}
        />
      )}
    </div>
  )
}

export default List