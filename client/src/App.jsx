import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import useAuthStore from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  const { initializeAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate
                  to={user?.role === "admin" ? "/admin" : "/dashboard"}
                  replace
                />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate
                  to={user?.role === "admin" ? "/admin" : "/dashboard"}
                  replace
                />
              ) : (
                <SignupPage />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  isAuthenticated
                    ? user?.role === "admin"
                      ? "/admin"
                      : "/dashboard"
                    : "/"
                }
                replace
              />
            }
          />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
