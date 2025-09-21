import { create } from "zustand";
import { authService } from "../services/authService";

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth state from localStorage
  initializeAuth: () => {
    try {
      const token = authService.getStoredToken();
      const user = authService.getStoredUser();

      if (token && user) {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      get().logout();
    }
  },

  // Login action
  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authService.login(credentials);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error;
    }
  },

  // Signup action
  signup: async (userData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authService.signup(userData);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Signup failed";
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error;
    }
  },

  // Logout action
  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Update user info
  updateUser: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  // Check if user is admin
  isAdmin: () => {
    const { user } = get();
    return user?.role === "admin";
  },

  // Refresh profile
  refreshProfile: async () => {
    try {
      const response = await authService.getProfile();
      const updatedUser = response.user;

      localStorage.setItem("user", JSON.stringify(updatedUser));
      set({ user: updatedUser });

      return updatedUser;
    } catch (error) {
      console.error("Error refreshing profile:", error);
      throw error;
    }
  },
}));

export default useAuthStore;
