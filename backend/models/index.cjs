// backend/models/index.js
// File này export tất cả models để dễ import

const User = require('./userModel.cjs');
const Product = require('./productModel.cjs');
const Order = require('./orderModel.cjs');
const Review = require('./reviewModel.cjs');
const Category = require('./categoryModel.cjs');
const Food = require('./foodModel.cjs');

module.exports = {
  User,
  Product,
  Order,
  Review,
  Category,
  Food
};