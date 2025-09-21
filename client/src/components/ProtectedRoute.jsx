import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
