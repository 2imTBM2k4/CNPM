import foodModel from '../models/foodModel.cjs'
import fs from 'fs'


// add food item

const addFood = async (req,res) => {

    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
        name:req.body.name,
        description:req.body.description,
        price:req.body.price,
        category:req.body.category,
        image:image_filename
    })
    try {
        await food.save();
        res.json({success:true,message:"Food Added"})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:"Error"})
    }
}

// all food list
const listFood = async (req,res) => {
    try {
        const foods = await foodModel.find({});
        res.json({success:true,data:foods})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// remove food item
const removeFood = async (req,res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${food.image}`,()=>{})

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({success:true,message:"Food Removed"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}
// update food item
const updateFood = async (req, res) => {
    try {
        const { id, name, description, price, category } = req.body;
        
        // Kiểm tra nếu thiếu ID
        if (!id) {
            return res.json({ success: false, message: "Product ID is required" });
        }

        let updateData = { 
            name: name,
            description: description, 
            price: Number(price), 
            category: category 
        };
        
        // Nếu có ảnh mới
        if (req.file) {
            // Xóa ảnh cũ
            const existingFood = await foodModel.findById(id);
            if (existingFood && existingFood.image) {
                try {
                    fs.unlink(`uploads/${existingFood.image}`, () => {});
                } catch (fileError) {
                    console.log("Error deleting old image:", fileError);
                }
            }
            updateData.image = req.file.filename;
        }
        
        const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!updatedFood) {
            return res.json({ success: false, message: "Product not found" });
        }
        
        res.json({ success: true, message: "Food Updated Successfully", data: updatedFood });
    } catch (error) {
        console.log("Update error:", error);
        res.json({ success: false, message: "Error updating food" });
    }
}


export {addFood,listFood,removeFood, updateFood}