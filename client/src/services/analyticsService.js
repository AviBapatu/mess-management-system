import api from "./api";

export const analyticsService = {
  async getAnalytics(params = {}) {
    const response = await api.get("/analytics", { params });
    return response.data;
  },

  async getRevenueAnalytics(params = {}) {
    const response = await api.get("/analytics/revenue", { params });
    return response.data;
  },
};
