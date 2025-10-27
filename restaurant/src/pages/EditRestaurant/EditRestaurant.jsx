import React, { useState, useEffect, useContext } from 'react';
import './EditRestaurant.css';
import { assets } from '../../assets/assets';
import axios from "axios";
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

const EditRestaurant = ({ url }) => {
  const { user } = useContext(AuthContext);
  const [image, setImage] = useState(null);
  const [data, setData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    description: ""
  });
  const [loading, setLoading] = useState(true);

  // Helper get ID (giữ nguyên)
  const getRestaurantId = () => {
    let id = user?.restaurantId;
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id._id) return id._id.toString();
    if (typeof id.toString === 'function') return id.toString();
    return null;
  };

  useEffect(() => {
    const restaurantId = getRestaurantId();
    console.log('User restaurantId (raw):', user?.restaurantId);
    console.log('Processed restaurantId:', restaurantId);
    console.log('Full URL prop:', url);
    if (restaurantId) {
      fetchRestaurant(restaurantId);
    } else {
      toast.error("No restaurant ID found. Please contact admin.");
      setLoading(false);
    }
  }, [user]);

  const fetchRestaurant = async (restaurantId) => {
    try {
      const response = await axios.get(`${url}/api/restaurant/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const myRestaurant = response.data.data.find(r => r._id.toString() === restaurantId);
        if (myRestaurant) {
          setData({
            name: myRestaurant.name || "",
            address: myRestaurant.address || "",
            email: myRestaurant.email || "",
            phone: myRestaurant.phone || "",
            description: myRestaurant.description || ""
          });
          const imagePath = myRestaurant.image ? `${url}${myRestaurant.image.startsWith('/') ? '' : '/'}${myRestaurant.image}` : null;
          setImage(imagePath);
        } else {
          toast.error("Restaurant not found. Create one first?");
        }
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      toast.error("Failed to load restaurant info: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      toast.error("No restaurant ID available.");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("address", data.address);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("description", data.description);
    const newImage = image && image.size ? image : null;
    if (newImage) {
      formData.append("image", newImage);
    }

    try {
      const fullUrl = `${url}/api/restaurant/${restaurantId}`;
      console.log('Final Request URL:', fullUrl);
      const response = await axios.put(fullUrl, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchRestaurant(restaurantId);  // Reload
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      const errMsg = error.response?.data?.message || error.message || "Update failed";
      toast.error(errMsg);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!getRestaurantId()) return <div className="error">No restaurant assigned.</div>;

  return (
    <div className='edit-restaurant'>
      <form className='flex-col' onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Restaurant Image</p>
          <label htmlFor="image">
            <img className='image' 
                 src={image ? (typeof image === 'string' ? image : URL.createObjectURL(image)) : assets.upload_area} 
                 alt="Restaurant" 
            />
          </label>
          <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden accept="image/*" />
        </div>
        <div className="add-product-name flex-col">
          <p>Restaurant Name</p>
          <input onChange={onChangeHandler} value={data.name} type="text" name='name' placeholder='Type here' required />
        </div>
        <div className="add-product-name flex-col">
          <p>Address</p>
          <input onChange={onChangeHandler} value={data.address} type="text" name='address' placeholder='Type here' required />
        </div>
        <div className="add-product-name flex-col">
          <p>Email</p>
          <input onChange={onChangeHandler} value={data.email} type="email" name='email' placeholder='example@restaurant.com' required />
        </div>
        <div className="add-product-name flex-col">
          <p>Phone</p>
          <input onChange={onChangeHandler} value={data.phone} type="tel" name='phone' placeholder='+1-234-567-890' />
        </div>
        <div className="add-product-description flex-col">
          <p>Description</p>
          <textarea onChange={onChangeHandler} value={data.description} name="description" rows="6" placeholder='Write content here'></textarea>
        </div>
        <button type='submit' className='add-btn'>UPDATE</button>
      </form>
    </div>
  );
};

export default EditRestaurant;