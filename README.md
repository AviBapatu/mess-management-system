# Mess Management System

A complete web application for managing mess operations with separate user and admin portals, built with Node.js + Express + MongoDB for the backend and React + Tailwind + Shadcn UI for the frontend.

## 🚀 Features

### User Portal

- **Account Management**: Secure signup/login with JWT authentication
- **Meal History**: View complete transaction history with detailed item breakdown
- **Personal Analytics**: Track spending patterns and meal frequency
- **Responsive Design**: Mobile-friendly interface

### Admin Portal

- **Dashboard Analytics**: Revenue tracking, popular items, user insights
- **Menu Management**: Full CRUD operations for menu items with categories
- **Transaction Monitoring**: View all user transactions with filtering
- **User Management**: Overview of registered users and their activity
- **Revenue Analytics**: Daily, monthly, and yearly revenue reports

### Technical Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Separate permissions for users and admins
- **Real-time Data**: Live updates from MongoDB database
- **Modern UI**: Clean, professional interface with Shadcn UI
- **Responsive Design**: Works seamlessly on all devices
- **Error Handling**: Comprehensive error messages and validation

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: bcryptjs for password hashing
- **Environment**: dotenv for configuration

### Frontend

- **Framework**: React 19.1.1 with Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd maneesha-project
```

### 2. Backend Setup

```bash
cd server
npm install

# Create .env file
echo "PORT=5000
JWT_SECRET_KEY=your_super_secret_jwt_key_here
MONGO_URI=mongodb://localhost:27017/mess-management" > .env

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../client
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start frontend development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## 👥 Test Accounts

After running the seed script, use these accounts to test the application:

**Admin Account:**

- Email: `admin@mess.com`
- Password: `admin123`

**User Accounts:**

- Email: `john@example.com` / Password: `user123`
- Email: `jane@example.com` / Password: `user123`
- Email: `mike@example.com` / Password: `user123`
- Email: `sarah@example.com` / Password: `user123`

## 📊 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Menu Management

- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create menu item (admin only)
- `PUT /api/menu/:id` - Update menu item (admin only)
- `DELETE /api/menu/:id` - Delete menu item (admin only)

### Transactions

- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - Get all transactions (admin only)
- `GET /api/transactions/user/:id/history` - Get user transactions

### Analytics

- `GET /api/analytics` - Get comprehensive analytics (admin only)
- `GET /api/analytics/revenue` - Get revenue analytics (admin only)

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'admin',
  createdAt: Date
}
```

### MenuItems Collection

```javascript
{
  _id: ObjectId,
  name: String (unique),
  price: Number,
  category: String,
  description: String,
  isAvailable: Boolean,
  createdAt: Date
}
```

### Transactions Collection

```javascript
{
  _id: ObjectId,
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

## 🏗️ Project Structure

```
maneesha-project/
├── server/                 # Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Database configuration
│   │   └── server.js       # Main server file
│   ├── seed.js            # Database seeding script
│   ├── package.json
│   └── README.md
│
├── client/                # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # Zustand state management
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
│   ├── package.json
│   └── README.md
│
└── README.md              # This file
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Protected Routes**: Middleware for route protection
- **Input Validation**: Comprehensive data validation
- **CORS Configuration**: Cross-origin request handling
- **Error Handling**: Secure error responses

## 📱 Screenshots & Features Demo

### User Dashboard

- Personal meal history with pagination
- Spending analytics and statistics
- Responsive design for mobile devices

### Admin Dashboard

- Revenue analytics with charts
- Menu item management with CRUD operations
- Transaction monitoring and user insights
- Popular items and top customers tracking

## 🚀 Production Deployment

### Backend Deployment

1. Set environment variables:

   - `NODE_ENV=production`
   - `JWT_SECRET_KEY=<secure-secret>`
   - `MONGO_URI=<production-mongodb-uri>`

2. Deploy to platforms like:
   - Heroku
   - Digital Ocean
   - AWS EC2
   - Railway

### Frontend Deployment

1. Update `VITE_API_URL` to production API URL
2. Build the application: `npm run build`
3. Deploy to platforms like:
   - Vercel
   - Netlify
   - AWS S3/CloudFront

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Notes

- Backend runs on port 5000 by default
- Frontend runs on port 5173 by default
- MongoDB connection required for backend
- CORS configured for local development
- JWT tokens expire after 7 days
- Sample data includes 50 transactions over 30 days

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running and URI is correct
2. **CORS Issues**: Check that frontend and backend URLs match in configuration
3. **JWT Errors**: Verify JWT_SECRET_KEY is set in backend .env
4. **Build Errors**: Ensure all dependencies are installed with `npm install`

### Support

- Check individual README files in `server/` and `client/` directories
- Review API documentation for endpoint details
- Ensure all environment variables are properly configured

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- UI components from Shadcn UI
- Icons from Lucide React
- Styled with Tailwind CSS
# mess-management-system
