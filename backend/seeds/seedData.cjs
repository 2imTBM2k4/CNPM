// backend/seeds/seedData.cjs
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load .env từ thư mục backend
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const { User, Product, Category, Food } = require('../models/index.cjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Sample Categories
const sampleCategories = [
  { name: 'Men', description: 'Men\'s fashion collection', isActive: true },
  { name: 'Women', description: 'Women\'s fashion collection', isActive: true },
  { name: 'Kids', description: 'Kids fashion collection', isActive: true },
  { name: 'Accessories', description: 'Fashion accessories', isActive: true },
  { name: 'Shoes', description: 'Footwear collection', isActive: true }
];

// Sample Products
const sampleProducts = [
  {
    name: 'Classic White T-Shirt',
    description: 'Premium quality cotton t-shirt, perfect for casual wear. Soft, breathable and comfortable.',
    price: 299000,
    originalPrice: 399000,
    category: 'Men',
    subCategory: 'Topwear',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Gray'],
    stock: 150,
    brand: 'Hangry Fashion',
    rating: 4.5,
    numReviews: 23,
    isFeatured: true,
    isActive: true,
    tags: ['casual', 'basic', 'cotton']
  },
  {
    name: 'Slim Fit Denim Jeans',
    description: 'Modern slim fit jeans with stretch fabric for maximum comfort. Perfect for everyday wear.',
    price: 799000,
    originalPrice: 999000,
    category: 'Men',
    subCategory: 'Bottomwear',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Dark Blue', 'Light Blue', 'Black'],
    stock: 80,
    brand: 'Hangry Fashion',
    rating: 4.7,
    numReviews: 45,
    isFeatured: true,
    isActive: true,
    tags: ['jeans', 'denim', 'casual']
  },
  {
    name: 'Summer Floral Dress',
    description: 'Light and breezy summer dress with beautiful floral patterns. Perfect for sunny days.',
    price: 599000,
    originalPrice: 799000,
    category: 'Women',
    subCategory: 'Casual',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Pink', 'Yellow', 'White', 'Blue'],
    stock: 60,
    brand: 'Hangry Fashion',
    rating: 4.8,
    numReviews: 67,
    isFeatured: true,
    isActive: true,
    tags: ['dress', 'summer', 'floral']
  },
  {
    name: 'Casual Sneakers',
    description: 'Comfortable everyday sneakers with cushioned sole. Perfect for walking and light exercise.',
    price: 899000,
    category: 'Shoes',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Red'],
    stock: 45,
    brand: 'Hangry Fashion',
    rating: 4.6,
    numReviews: 34,
    isFeatured: false,
    isActive: true,
    tags: ['shoes', 'sneakers', 'casual']
  },
  {
    name: 'Leather Backpack',
    description: 'Premium leather backpack with multiple compartments. Perfect for work or travel.',
    price: 1299000,
    category: 'Accessories',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'
    ],
    sizes: ['M', 'L'],
    colors: ['Brown', 'Black', 'Tan'],
    stock: 30,
    brand: 'Hangry Fashion',
    rating: 4.9,
    numReviews: 12,
    isFeatured: true,
    isActive: true,
    tags: ['backpack', 'leather', 'accessories']
  }
];

// Sample Foods (nếu project dùng foodModel)
const sampleFoods = [
  {
    name: 'Burger Classic',
    description: 'Delicious classic burger with beef patty',
    price: 89000,
    category: 'Fast Food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    isAvailable: true
  },
  {
    name: 'Margherita Pizza',
    description: 'Traditional Italian pizza with fresh mozzarella',
    price: 129000,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
    isAvailable: true
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...\n');
    
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    if (Food) await Food.deleteMany({});
    console.log('✅ Database cleared\n');

    // Create Admin User
    console.log('👤 Creating users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Admin Hangry',
      email: 'admin@hangry.com',
      password: hashedAdminPassword,
      isAdmin: true,
      phone: '0901234567'
    });
    console.log('✅ Admin user created');

    // Create Sample User
    const hashedUserPassword = await bcrypt.hash('user123', 10);
    const sampleUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedUserPassword,
      isAdmin: false,
      phone: '0907654321',
      address: {
        street: '123 Main St',
        city: 'Ho Chi Minh',
        state: 'HCMC',
        country: 'Vietnam',
        zipCode: '700000'
      }
    });
    console.log('✅ Sample user created\n');

    // Create Categories
    console.log('📁 Creating categories...');
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`✅ ${createdCategories.length} categories created\n`);

    // Create Products
    console.log('🛍️  Creating products...');
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ ${createdProducts.length} products created\n`);

    // Create Foods (if foodModel exists)
    if (Food) {
      console.log('🍔 Creating food items...');
      const createdFoods = await Food.insertMany(sampleFoods);
      console.log(`✅ ${createdFoods.length} food items created\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY! 🎉');
    console.log('═══════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Categories: ${await Category.countDocuments()}`);
    console.log(`   Products: ${await Product.countDocuments()}`);
    if (Food) console.log(`   Foods: ${await Food.countDocuments()}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('   ┌─────────────────────────────────────┐');
    console.log('   │ ADMIN                               │');
    console.log('   │ Email: admin@hangry.com             │');
    console.log('   │ Password: admin123                  │');
    console.log('   ├─────────────────────────────────────┤');
    console.log('   │ USER                                │');
    console.log('   │ Email: john@example.com             │');
    console.log('   │ Password: user123                   │');
    console.log('   └─────────────────────────────────────┘\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR SEEDING DATABASE:');
    console.error(error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();