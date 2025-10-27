const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {  
    type: String,
    enum: ['user', 'restaurant_owner', 'admin'],
    default: 'user'
  },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  cart: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    size: String,
    color: String
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food'
  }],
  locked: { type: Boolean, default: false }  // Mới: Để lock account
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);