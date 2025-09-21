# Mess Management System - Frontend

A modern React frontend for the Mess Management System with user and admin portals, built with Tailwind CSS and Shadcn UI components.

## Features

### User Portal

- **Authentication**: Secure login/signup with JWT
- **Transaction History**: View complete meal history
- **Responsive Design**: Works on all devices
- **Real-time Updates**: Live data from backend API

### Admin Portal

- **Dashboard Overview**: Revenue analytics and insights
- **Menu Management**: Add, edit, delete menu items
- **Transaction Monitoring**: View all user transactions
- **Analytics**: Popular items, top customers, revenue trends

### UI/UX Features

- **Modern Design**: Clean and professional interface
- **Shadcn UI Components**: High-quality, accessible components
- **Responsive Tables**: Paginated data with search/filter
- **Toast Notifications**: User feedback for all actions
- **Loading States**: Smooth user experience
- **Error Handling**: Comprehensive error messages

## Tech Stack

- **Frontend Framework**: React 19.1.1
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Running backend server

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will start on `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── ui/             # Shadcn UI components
│   └── ProtectedRoute.jsx
├── pages/              # Page components
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── UserDashboard.jsx
│   └── AdminDashboard.jsx
├── services/           # API service modules
│   ├── api.js
│   ├── authService.js
│   ├── menuService.js
│   ├── transactionService.js
│   └── analyticsService.js
├── store/              # Zustand state management
│   └── authStore.js
├── hooks/              # Custom React hooks
│   └── use-toast.js
└── lib/                # Utility functions
    └── utils.js
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Authentication

The app uses JWT-based authentication with automatic token management:

- Tokens stored in localStorage
- Automatic token refresh
- Protected routes based on authentication status
- Role-based route protection (admin/user)

## API Integration

All API calls are handled through service modules:

- **authService**: Authentication operations
- **menuService**: Menu CRUD operations
- **transactionService**: Transaction management
- **analyticsService**: Analytics and reporting

## State Management

Using Zustand for global state management:

- **authStore**: User authentication state
- Persistent authentication across browser sessions
- Automatic cleanup on logout

## Styling

The app uses Tailwind CSS with custom configurations:

- **Responsive design**: Mobile-first approach
- **Dark mode ready**: CSS variables for theming
- **Custom components**: Built with Tailwind utilities
- **Consistent spacing**: Standardized design system

## Component Library

Built with Shadcn UI components:

- **Form components**: Input, Label, Button
- **Data display**: Table, Card, Badge
- **Layout**: Tabs, Dialog, Toast
- **Navigation**: Routing with React Router

## Features by Role

### Regular Users

- View personal transaction history
- See meal statistics
- Responsive mobile interface
- Secure authentication

### Admin Users

- Comprehensive analytics dashboard
- Menu item management (CRUD)
- View all user transactions
- Revenue and popularity insights
- User management overview

## Production Build

1. Build the application:

   ```bash
   npm run build
   ```

2. The build files will be in the `dist` directory

3. Deploy to your preferred hosting service:
   - Vercel
   - Netlify
   - AWS S3/CloudFront
   - Digital Ocean

## Environment Variables

- `VITE_API_URL`: Backend API base URL

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Add appropriate tests
5. Commit your changes
6. Push to the branch
7. Create a Pull Request

## Deployment Notes

- Ensure the backend API is deployed and accessible
- Update `VITE_API_URL` to point to production API
- Configure proper CORS settings in backend
- Use HTTPS in production

## License

This project is licensed under the ISC License.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
