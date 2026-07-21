# Hangry - Food Delivery Platform with Drone Support

A full-stack food delivery web application with drone-based delivery, built with Express.js, React, and MongoDB.

## Architecture

```
├── backend/          Express.js REST API (Node.js)
├── user/             React app - Customer-facing
├── admin/            React app - Admin dashboard
└── restaurant/       React app - Restaurant owner panel
```

### Backend Architecture

The backend follows a layered **Controller → Service → Repository** pattern:

- **Controllers** handle HTTP request/response
- **Services** contain business logic
- **Repositories** wrap Mongoose queries

```
backend/
├── server.js              # Entry point (HTTP server, Socket.io, Cloudinary)
├── app.js                 # Express app (routes, middleware) — separated for testing
├── config/                # DB connection, Cloudinary, Multer
├── controllers/           # HTTP handlers
├── services/              # Business logic
├── repositories/          # Database queries
├── models/                # Mongoose schemas
├── middleware/             # JWT auth (protect, optionalAuth)
├── routes/                # Route definitions
├── seeds/                 # Database seed scripts
└── tests/                 # Vitest test suite
    ├── setup.js           # MongoDB in-memory server
    ├── helpers.js          # Test utilities (create users, tokens, etc.)
    ├── unit/              # Unit tests (services, middleware)
    ├── integration/       # API endpoint tests
    └── flows/             # End-to-end business flow tests
```

## Tech Stack

### Backend
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (7-day expiry)
- **Real-time**: Socket.io (order notifications to restaurants)
- **Payments**: Stripe, PayPal
- **Image hosting**: Cloudinary
- **File upload**: Multer (JPEG/PNG/GIF/WebP, 5MB limit)
- **Security**: CORS whitelist, express-rate-limit, bcrypt password hashing
- **Testing**: Vitest, supertest, mongodb-memory-server

### Frontend (all three apps)
- **Framework**: React 18
- **Build tool**: Vite
- **Routing**: React Router v6
- **HTTP**: Axios
- **Notifications**: React Toastify
- **Maps**: Leaflet / TrackAsia GL

## Features

### Customer (user/)
- Browse restaurants and food items
- Add to cart (single-restaurant restriction)
- Place orders (COD, Card via Stripe, PayPal)
- Track drone delivery in real-time
- Confirm order receipt
- Cancel pending orders with reason
- View order history

### Restaurant Owner (restaurant/)
- Register restaurant (requires admin approval)
- Manage food menu (add, edit, remove with images)
- Receive real-time order notifications via Socket.io
- Accept orders (pending → preparing → delivering)
- Cancel orders with reason
- View order history

### Admin (admin/)
- Dashboard with statistics (users, orders, revenue)
- Manage users (lock/unlock accounts)
- Approve/reject restaurants (lock/unlock)
- Manage drone fleet
- View all orders across restaurants

### Drone Delivery System
- Auto-assign available drone when order starts delivering
- QR code generated for delivery verification
- Cargo weight tracking
- Drone status management (available, delivering, delivered)
- Delivery history logging

## Order Status Flow

```
pending → preparing → delivering → delivered
   ↓          ↓
cancelled  cancelled
(by user)  (by restaurant, requires reason)
```

- **User** can cancel only when `pending`
- **Restaurant** can cancel at `pending` or `preparing` (reason required)
- **Admin** can update any status
- **COD** orders are auto-marked as paid when delivered
- **Balance** is split 80% restaurant / 20% platform on completion

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Stripe account (for card payments)
- PayPal developer account (for PayPal payments)

### 1. Clone the repository

```bash
git clone https://github.com/2imTBM2k4/CNPM.git
cd CNPM
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/hangry
JWT_SECRET=your-secret-key

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=your-paypal-client-id

FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

Seed the database (optional):

```bash
node seeds/seedData.cjs     # Users + restaurants + food items
npm run seed:drones          # Drone fleet
```

Start the backend:

```bash
npm run dev
```

### 3. Setup Frontend Apps

Each frontend app needs a `.env` file:

```env
VITE_API_URL=http://localhost:4000
```

Then install and run:

```bash
# Customer app (port 5173)
cd user && npm install && npm run dev

# Admin dashboard (port 5174)
cd admin && npm install && npm run dev

# Restaurant panel (port 5175)
cd restaurant && npm install && npm run dev
```

## Testing

The backend has **82 automated tests** covering unit, integration, and end-to-end business flows.

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Test Structure

| Type | Tests | What it covers |
|------|-------|----------------|
| Unit | 36 | Services (user, cart), auth middleware |
| Integration | 36 | API endpoints (auth, cart, order) |
| Flow | 10 | Full business scenarios (order lifecycle, auth, cart rules) |

### Example Flow Tests

- User places COD order → restaurant confirms → delivers → balance splits 80/20
- User cancels pending order → order cancelled, no balance change
- User cannot cancel preparing/delivering order
- User A cannot access User B's orders
- Cart rejects items from different restaurants

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/user/register` | - | Register user |
| POST | `/api/user/login` | - | Login |
| POST | `/api/user/logout` | - | Logout |
| GET | `/api/user/me` | Required | Get profile |

### Food
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/food/list` | Optional | List food items |
| GET | `/api/food/:id` | - | Get food by ID |
| POST | `/api/food/add` | Required | Add food (restaurant owner) |
| POST | `/api/food/update` | Required | Update food |
| POST | `/api/food/remove` | Required | Remove food |

### Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart/get` | Required | Get cart |
| POST | `/api/cart/add` | Required | Add item |
| POST | `/api/cart/remove` | Required | Remove item |
| POST | `/api/cart/clear` | Required | Clear cart |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/order/place` | Required | Place order |
| GET | `/api/order/verify` | - | Verify payment |
| GET | `/api/order/userorders` | Required | User's orders |
| GET | `/api/order/list` | Required | List orders (admin/restaurant) |
| POST | `/api/order/status` | Required | Update order status |
| GET | `/api/order/status-stats` | Admin | Order statistics |

### Restaurant
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/restaurant/list` | Optional | List restaurants |
| GET | `/api/restaurant/:id` | Required | Get restaurant |
| POST | `/api/restaurant/` | Required | Create restaurant |
| PUT | `/api/restaurant/:id` | Required | Update restaurant |
| DELETE | `/api/restaurant/` | Required | Delete restaurant |
| PUT | `/api/restaurant/:id/lock` | Admin | Lock/unlock restaurant |

### Drone
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/drone/` | Required | List drones |
| GET | `/api/drone/:id` | Required | Get drone |
| POST | `/api/drone/create` | Required | Create drone |
| PUT | `/api/drone/:id` | Required | Update drone |
| DELETE | `/api/drone/:id` | Required | Delete drone |
| POST | `/api/drone/assign` | Required | Assign drone to order |
| POST | `/api/drone/scan-qr` | Required | Scan QR code |
| POST | `/api/drone/confirm-delivery` | Required | Confirm delivery |

## Default Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hangry.com | admin123 |
| User | john@example.com | user123 |
