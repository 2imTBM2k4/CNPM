const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true, unique: true },  // Thêm: Email required & unique
  phone: { type: String },
  description: { type: String },
  image: { type: String },  // Đã có, lưu path như /uploads/restaurant_xxx.png
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);