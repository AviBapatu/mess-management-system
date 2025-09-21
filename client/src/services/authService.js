import api from "./api";

export const authService = {
  async signup(userData) {
    const response = await api.post("/auth/signup", userData);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getProfile() {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getStoredUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getStoredToken() {
    return localStorage.getItem("token");
  },

  isAuthenticated() {
    return !!this.getStoredToken();
  },
};
