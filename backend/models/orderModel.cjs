// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   orderItems: [{
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Food',  // Sửa: Ref 'Food' thay vì 'Product'
//       required: true
//     },
//     name: String,
//     quantity: {
//       type: Number,
//       required: true,
//       min: 1
//     },
//     price: {
//       type: Number,
//       required: true
//     },
//     image: String,
//     size: String,
//     color: String
//   }],
//   shippingAddress: {
//     fullName: {
//       type: String,
//       required: true
//     },
//     address: {
//       type: String,
//       required: true
//     },
//     city: {
//       type: String,
//       required: true
//     },
//     state: {
//       type: String,
//       required: true
//     },
//     country: {
//       type: String,
//       required: true
//     },
//     zipCode: {
//       type: String,
//       required: true
//     },
//     phone: {
//       type: String,
//       required: true
//     }
//   },
//   paymentMethod: {
//     type: String,
//     required: true,
//     enum: ['Card', 'COD', 'PayPal']  // Sửa: Xóa 'Cash', 'UPI', thêm COD, PayPal
//   },
//   paymentResult: {
//     id: String,
//     status: String,
//     update_time: String,
//     email_address: String
//   },
//   taxPrice: {
//     type: Number,
//     default: 0
//   },
//   shippingPrice: {
//     type: Number,
//     default: 0
//   },
//   totalPrice: {
//     type: Number,
//     required: true
//   },
//   isPaid: {
//     type: Boolean,
//     default: false
//   },
//   paidAt: {
//     type: Date
//   },
//   isDelivered: {
//     type: Boolean,
//     default: false
//   },
//   deliveredAt: {
//     type: Date
//   },
//   orderStatus: {
//     type: String,
//     enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
//     default: 'Pending'
//   },
//   stripeSessionId: String,
//   restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }  // Mới: Liên kết với restaurant
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Order', orderSchema);

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    image: String,
    size: String,
    color: String
  }],
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Card', 'COD', 'PayPal']
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  taxPrice: {
    type: Number,
    default: 0
  },
  shippingPrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'],  // Fix: All lowercase theo yêu cầu
    default: 'pending'  // Fix: Lowercase
  },
  reason: {  // Lý do cho 'cancelled'
    type: String,
    default: ''
  },
  stripeSessionId: String,
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);