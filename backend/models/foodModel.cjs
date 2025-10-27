const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: {type:String,required:true},
    description: {type:String,required:true},
    price:{type:Number,required:true},
    image:{type:String,required:true},
    category:{type:String,required:true},
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }  // Mới: Liên kết với restaurant
});

module.exports = mongoose.model('Food', foodSchema);