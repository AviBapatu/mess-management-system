# Mess Management System - Backend

A comprehensive Node.js backend for managing mess operations with JWT authentication, role-based access control, and analytics.

## Features

- **Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Password hashing with bcrypt

- **Menu Management**

  - CRUD operations for menu items
  - Category-based organization
  - Availability tracking

- **Transaction Management**

  - Complete transaction history
  - User-specific transaction records
  - Payment method tracking

- **Analytics Dashboard**
  - Revenue analytics
  - Popular menu items tracking
  - User spending patterns
  - Transaction insights

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: bcryptjs
- **Environment**: dotenv for configuration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- npm or yarn

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:

   ```env
   PORT=5000
   JWT_SECRET_KEY=your_super_secret_jwt_key_here
   MONGO_URI=mongodb://localhost:27017/mess-management
   ```

3. Seed the database with sample data:

   ```bash
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Menu Management

- `GET /api/menu` - Get all menu items (public)
- `POST /api/menu` - Create menu item (admin only)
- `PUT /api/menu/:id` - Update menu item (admin only)
- `DELETE /api/menu/:id` - Delete menu item (admin only)
- `GET /api/menu/:id` - Get specific menu item

### Transactions

- `POST /api/transactions` - Create new transaction (protected)
- `GET /api/transactions` - Get all transactions (admin only)
- `GET /api/transactions/user/:id/history` - Get user transactions (protected)
- `GET /api/transactions/:id` - Get specific transaction (protected)

### Analytics

- `GET /api/analytics` - Get comprehensive analytics (admin only)
- `GET /api/analytics/revenue` - Get revenue analytics (admin only)

## Sample Data

After running the seed script, you can use these test accounts:

**Admin Account:**

- Email: `admin@mess.com`
- Password: `admin123`

**User Accounts:**

- Email: `john@example.com` / Password: `user123`
- Email: `jane@example.com` / Password: `user123`
- Email: `mike@example.com` / Password: `user123`
- Email: `sarah@example.com` / Password: `user123`

## Database Schema

### Users

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String ('user' | 'admin'),
  createdAt: Date
}
```

### MenuItems

```javascript
{
  name: String (unique),
  price: Number,
  category: String,
  description: String,
  isAvailable: Boolean,
  createdAt: Date
}
```

### Transactions

```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  paymentMethod: String,
  status: String,
  createdAt: Date
}
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT token-based authentication
- Protected routes with middleware
- Input validation and sanitization
- Error handling middleware
- CORS configuration

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a secure JWT secret key
3. Configure MongoDB connection for production
4. Set up proper CORS origins
5. Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
