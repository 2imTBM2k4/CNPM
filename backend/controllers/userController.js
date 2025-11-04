import userModel from "../models/userModel.cjs";
import restaurantModel from "../models/restaurantModel.cjs";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"

// login user
const loginUser = async (req,res) => {
    const {email,password} = req.body;
    try {
        const user = await userModel.findOne({email})

        if (!user){
            return res.json({success:false,message:"User doesn't exist."})
        }

        if (user.locked) {
            return res.json({success:false,message:"Account is locked."})
        }

        const isMatch = await bcrypt.compare(password,user.password);

        if (!isMatch) {
            return res.json({success:false,message:"Invalid credentials"})
        }

        const token = createToken(user._id);
        res.json({success:true,token})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const createToken = (id) => {
    return jwt.sign({id},process.env.JWT_SECRET)
}

// register user (hỗ trợ role, tạo restaurant nếu owner)
const registerUser = async (req,res) => {
    const {name, password, email, role, restaurantName, address, phone} = req.body;
    try {
        const exists = await userModel.findOne({email});
        if (exists){
            return res.json({success:false,message:"User already exists."})
        }

        if (!validator.isEmail(email)){
            return res.json({success:false,message:"Please enter a valid email."})
        }

        if (password.length<8){
            return res.json({success:false,message:"Please enter a strong password."})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new userModel({
            name: role === 'restaurant_owner' ? restaurantName : name,
            email,
            password: hashedPassword,
            role: role || 'user',
            phone,
            address: { street: address }
        })

        const user = await newUser.save()

        if (role === 'restaurant_owner') {
            const newRestaurant = new restaurantModel({
                name: restaurantName,
                address,
                phone,
                owner: user._id
            });
            await newRestaurant.save();
            user.restaurantId = newRestaurant._id;
            await user.save();
        }

        const token = createToken(user._id)
        res.json({success:true,token});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// Mới: Lock user (admin only)
const lockUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const { id, locked } = req.body;
    const updated = await userModel.findByIdAndUpdate(id, { locked }, { new: true });
    if (!updated) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: locked ? "User locked" : "User unlocked" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const getMe = async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching user info" });
  }
};

// MỚI: Update delivery address/phone (protected)
const updateUserAddress = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (req.user._id !== req.userId) { // Kiểm tra ownership (từ auth middleware)
      return res.json({ success: false, message: "Unauthorized" });
    }

    // Validate input (optional, cơ bản)
    if (!address || !address.street || !address.city) {
      return res.json({ success: false, message: "Invalid address data" });
    }

    const updateData = {
      name: name || req.user.name,
      phone: phone || req.user.phone,
      address: {
        ...req.user.address,
        ...address // Merge, override existing
      }
    };

    const updatedUser = await userModel.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser, message: "Address updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating address" });
  }
};

export { loginUser, registerUser, lockUser, getMe, updateUserAddress }; // MỚI: Export thêm