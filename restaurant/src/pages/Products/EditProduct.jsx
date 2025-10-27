import React, { useState, useEffect } from 'react'
import axios from "axios"
import { toast } from 'react-toastify'
import './EditProduct.css'

const EditProduct = ({ url, product, onClose, onUpdate }) => {
    const [image, setImage] = useState(null);
    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Salad"
    })

    useEffect(() => {
        if (product) {
            setData({
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category
            })
        }
    }, [product])

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append("id", product._id)
        formData.append("name", data.name)
        formData.append("description", data.description)
        formData.append("price", Number(data.price))
        formData.append("category", data.category)
        if (image) {
            formData.append("image", image)
        }

        try {
            const response = await axios.post(`${url}/api/food/update`, formData)
            if (response.data.success) {
                toast.success(response.data.message)
                onUpdate();
                onClose();
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log("Update error:", error);
            toast.error("Error updating product")
        }
    }

    return (
        <div className="edit-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Edit Product</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <form className='flex-col' onSubmit={onSubmitHandler}>
                    <div className="add-img-upload flex-col">
                        <p>Current Image</p>
                        <label htmlFor="edit-image">
                            <img className='image' 
                                 src={image ? URL.createObjectURL(image) : 
                                      `${url}/images/${product?.image}`} 
                                 alt="" />
                        </label>
                        <input onChange={(e) => setImage(e.target.files[0])} 
                               type="file" id="edit-image" hidden />
                        <p className="upload-text">Click to upload new image</p>
                    </div>
                    <div className="add-product-name flex-col">
                        <p>Product name</p>
                        <input onChange={onChangeHandler} value={data.name} 
                               type="text" name='name' placeholder='Type here' required />
                    </div>
                    <div className="add-product-description flex-col">
                        <p>Product Description</p>
                        <textarea onChange={onChangeHandler} value={data.description} 
                                  name="description" rows="6" placeholder='Write content here' required></textarea>
                    </div>
                    <div className="add-category-price">
                        <div className="add-category flex-col">
                            <p>Product Category</p>
                            <select className='selectt' onChange={onChangeHandler} 
                                    name="category" value={data.category}>
                                <option value="Salad">Salad</option>
                                <option value="Rolls">Rolls</option>
                                <option value="Deserts">Deserts</option>
                                <option value="Sandwich">Sandwich</option>
                                <option value="Cake">Cake</option>
                                <option value="Pure Veg">Pure Veg</option>
                                <option value="Pasta">Pasta</option>
                                <option value="Noodles">Noodles</option>
                            </select>
                        </div>
                        <div className="add-price flex-col">
                            <p>Product Price</p>
                            <input className='inputclasa' onChange={onChangeHandler} 
                                   value={data.price} type="Number" name='price' placeholder='$20' required />
                        </div>
                    </div>
                    <div className="modal-buttons">
                        <button type='button' className='cancel-btn' onClick={onClose}>CANCEL</button>
                        <button type='submit' className='update-btn'>UPDATE</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditProduct